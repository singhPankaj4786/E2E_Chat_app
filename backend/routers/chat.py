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

manager = ConnectionManager()

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    # 1. Accept the connection ONLY ONCE at the very beginning
    await websocket.accept()
    
    db = SessionLocal()
    user = None
    try:
        # 2. Authenticate
        user = await auth.get_current_user_from_token(token, db)
        
        # 3. Add to manager (without calling accept again)
        await manager.connect(user.id, websocket)
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            recipient_id = int(message_data.get("recipient_id"))
            content = message_data.get("content")

            # Save to Database
            new_msg = models.Message(
                sender_id=user.id,
                recipient_id=recipient_id,
                content=content
            )
            db.add(new_msg)
            db.commit()
            
            # Broadcast the message
            broadcast_data = {
                "id": new_msg.id,
                "sender_id": user.id,
                "content": content,
                "timestamp": datetime.utcnow().isoformat()
            }
            await manager.send_personal_message(json.dumps(broadcast_data), recipient_id)
            
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
    # Fetch messages between the two users
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user.id) & (models.Message.recipient_id == recipient_id)) |
        ((models.Message.sender_id == recipient_id) & (models.Message.recipient_id == current_user.id))
    ).order_by(models.Message.timestamp.asc()).all()
    
    return messages