from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import auth
from database import SessionLocal
import json

router = APIRouter()

class PresenceManager:
    def __init__(self):
        self.active_connections = {}  # user_id -> websocket

    async def connect(self, user_id: int, websocket: WebSocket):
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def broadcast(self, message: dict):
        for ws in self.active_connections.values():
            await ws.send_text(json.dumps(message))

    def get_online_users(self):
        return list(self.active_connections.keys())


manager = PresenceManager()


@router.websocket("/ws/{token}")
async def presence_websocket(websocket: WebSocket, token: str):
    await websocket.accept()
    db = SessionLocal()
    user = None

    try:
        user = await auth.get_current_user_from_token(token, db)

        await manager.connect(user.id, websocket)

        # 1️⃣ Send currently online users to newly connected client
        await websocket.send_text(json.dumps({
            "type": "initial_state",
            "online_users": manager.get_online_users()
        }))

        # 2️⃣ Broadcast that this user is online
        await manager.broadcast({
            "type": "status_change",
            "user_id": user.id,
            "status": "online"
        })

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass

    finally:
        if user:
            manager.disconnect(user.id)

            await manager.broadcast({
                "type": "status_change",
                "user_id": user.id,
                "status": "offline"
            })

        db.close()
