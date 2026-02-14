import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Dict, List

import auth, models, schemas
from database import get_db

router = APIRouter()

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # Maps user_id -> WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# --- HTTP Routes ---
@router.get("/history/{recipient_id}")
async def get_history(recipient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user.id) & (models.Message.recipient_id == recipient_id)) |
        ((models.Message.sender_id == recipient_id) & (models.Message.recipient_id == current_user.id))
    ).order_by(models.Message.timestamp.asc()).all()
    return messages

# --- WebSocket Route ---
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    # Verify the user using our new helper
    try:
        user = await auth.get_current_user_from_token(token, db)
    except Exception:
        await websocket.close(code=1008)  # 1008 = Policy Violation
        return

    await manager.connect(user.id, websocket)
    # ... rest of your logic
    # 1. Authenticate the user from the URL token
    try:
        # We manually call our auth logic since WebSockets don't support custom headers easily
        user = await auth.get_current_user_from_token(token, db)
    except Exception:
        await websocket.close(code=1008) # Policy Violation
        return

    await manager.connect(user.id, websocket)

    try:
        while True:
            # Receive incoming encrypted JSON from React
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # message_data format: {"recipient_id": X, "encrypted_content": "..."}
            
            # 2. Save the encrypted blob to the database
            new_msg = models.Message(
                sender_id=user.id,
                recipient_id=message_data['recipient_id'],
                encrypted_content=message_data['encrypted_content'] 
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)

            # 3. Relay the message to the recipient if they are online
            payload = {
                "id": new_msg.id,
                "sender_id": user.id,
                "encrypted_content": message_data['encrypted_content'],
                "timestamp": new_msg.timestamp.isoformat()
            }
            await manager.send_personal_message(payload, message_data['recipient_id'])

    except WebSocketDisconnect:
        manager.disconnect(user.id)