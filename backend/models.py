from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    public_key = Column(String) # Keep this for the E2EE phase later

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    
    # New column for plain text phase
    content = Column(String, nullable=True) 
    
    # Keep this for the E2EE phase later
    encrypted_content = Column(String, nullable=True) 
    
    timestamp = Column(DateTime, default=datetime.utcnow)