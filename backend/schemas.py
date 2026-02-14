from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- User Schemas ---
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

    class Config:
        from_attributes = True

# --- Message Schemas ---

# Used when receiving a message from the frontend via API (if used)
class MessageCreate(BaseModel):
    recipient_id: int
    content: str # Added for plain-text phase

# Used when sending history back to the frontend
class MessageOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: Optional[str] = None # Added for plain-text phase
    encrypted_content: Optional[str] = None # Kept for future E2EE
    timestamp: datetime

    class Config:
        from_attributes = True