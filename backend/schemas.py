# backend/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ---------- User Schemas ----------

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    public_key: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    public_key: str
    unread_count: int = 0  # New field added to the schema
    
    class Config:
        from_attributes = True


# ---------- Message Schemas ----------

# Used internally if needed for validation
class MessageCreate(BaseModel):
    recipient_id: int
    encrypted_content: str
    encrypted_key: str
    iv: str


# Returned when sending chat history
class MessageOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    encrypted_content: str
    encrypted_key: str
    iv: str
    timestamp: datetime

    class Config:
        from_attributes = True
