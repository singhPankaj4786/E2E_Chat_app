import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import models, auth
from datetime import datetime
from database import SessionLocal

router = APIRouter()

# backend/routers/chat.py

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        # DO NOT call websocket.accept() here
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)
    # Professional addition for security broadcasting
    async def broadcast(self, message: str):
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Broadcast failed for user {user_id}: {e}")

manager = ConnectionManager()

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    await websocket.accept()
    db = SessionLocal()
    user = None

    try:
        user = await auth.get_current_user_from_token(token, db)
        await manager.connect(user.id, websocket)

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            # Handle typing event
            if message_data.get("type") == "typing":
                recipient_id = int(message_data.get("recipient_id"))

                await manager.send_personal_message(
                    json.dumps({
                        "type": "typing",
                        "sender_id": user.id
                    }),
                    recipient_id
                )

                continue

            # Inside the while True loop of your websocket_endpoint in chat.py
            if message_data.get("type") == "mark_read":
                sender_id = int(message_data.get("sender_id"))
                
                # Update all messages from this sender to the current user as read
                db.query(models.Message).filter(
                    models.Message.sender_id == sender_id,
                    models.Message.recipient_id == user.id,
                    models.Message.is_read == False
                ).update({"is_read": True})
                
                db.commit()
                continue

            recipient_id = int(message_data.get("recipient_id"))

            ciphertext = message_data.get("ciphertext")
            encrypted_key_for_recipient = message_data.get("encrypted_key_for_recipient")
            encrypted_key_for_sender = message_data.get("encrypted_key_for_sender")
            iv = message_data.get("iv")

            # Save to database
            new_msg = models.Message(
                sender_id=user.id,
                recipient_id=recipient_id,
                encrypted_content=ciphertext,
                encrypted_key_for_recipient=encrypted_key_for_recipient,
                encrypted_key_for_sender=encrypted_key_for_sender,
                iv=iv
            )

            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)

            # Prepare two different payloads

            # 🔐 Payload for recipient
            recipient_payload = {
                "id": new_msg.id,
                "sender_id": user.id,
                "recipient_id": recipient_id,
                "encrypted_content": ciphertext,
                "encrypted_key": encrypted_key_for_recipient,
                "iv": iv,
                "timestamp": new_msg.timestamp.isoformat()+ "Z"
            }

            # 🔐 Payload for sender
            sender_payload = {
                "id": new_msg.id,
                "sender_id": user.id,
                "recipient_id": recipient_id,
                "encrypted_content": ciphertext,
                "encrypted_key": encrypted_key_for_sender,
                "iv": iv,
                "timestamp": new_msg.timestamp.isoformat()+ "Z"
            }

            # Send to recipient
            await manager.send_personal_message(
                json.dumps(recipient_payload),
                recipient_id
            )

            # Send back to sender
            await manager.send_personal_message(
                json.dumps(sender_payload),
                user.id
            )

                    

    except Exception as e:
        print(f"WS Error: {e}")
    finally:
        if user:
            manager.disconnect(user.id)
        db.close()


@router.get("/history/{recipient_id}")
async def get_chat_history(
    recipient_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user.id) &
         (models.Message.recipient_id == recipient_id)) |
        ((models.Message.sender_id == recipient_id) &
         (models.Message.recipient_id == current_user.id))
    ).order_by(models.Message.timestamp.asc()).all()

    result = []

    for msg in messages:
        if current_user.id == msg.sender_id:
            encrypted_key = msg.encrypted_key_for_sender
        else:
            # Otherwise, give them the key encrypted with the recipient's public key
            encrypted_key = msg.encrypted_key_for_recipient

        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "recipient_id": msg.recipient_id,
            "encrypted_content": msg.encrypted_content,
            "encrypted_key": encrypted_key,
            "iv": msg.iv,
            "timestamp": msg.timestamp.isoformat() + "Z"

        })

    return result
