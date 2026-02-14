from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Used for POST /users/signup
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    public_key: str  # Must match the 'public_key' field in your React payload

# Used for User responses (GET /users/all)
class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    public_key: str

    class Config:
        from_attributes = True

# Used for GET /chat/history
class MessageOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    encrypted_content: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Used for POST /chat/send
class MessageCreate(BaseModel):
    recipient_id: int
    encrypted_content: str