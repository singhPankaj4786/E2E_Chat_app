# backend/models.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    public_key = Column(String)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))

    encrypted_content = Column(String, nullable=False)

    # 🔐 Dual encrypted keys
    encrypted_key_for_sender = Column(String, nullable=False)
    encrypted_key_for_recipient = Column(String, nullable=False)

    iv = Column(String, nullable=False)
    
    timestamp = Column(DateTime, default=datetime.utcnow)
