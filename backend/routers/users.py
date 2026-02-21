from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import auth, models, schemas
from database import get_db
from .chat import manager
import json

router = APIRouter()

@router.post("/signup", response_model=schemas.UserOut)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists in Postgres
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and save user with their Public Key
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        public_key=user.public_key
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # Lookup by email (passed as 'username' in the form)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate token with User ID as the subject
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user.username,
        "user_id": user.id,
        "public_key": user.public_key
    }

@router.get("/all", response_model=List[schemas.UserOut])
def get_all_users(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    users = db.query(models.User).filter(models.User.id != current_user.id).all()
    
    for user in users:
        # Count messages where this user is the sender and current_user is the recipient
        unread = db.query(models.Message).filter(
            models.Message.sender_id == user.id,
            models.Message.recipient_id == current_user.id,
            models.Message.is_read == False
        ).count()
        user.unread_count = unread
        
    return users

@router.post("/update-public-key")
async def update_public_key(
    key_data: schemas.KeyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Update the database record
    current_user.public_key = key_data.public_key
    db.commit()
    
    # 2. Real-time Broadcast
    # This notifies all online peers to trigger the 'Red Shield' alert
    await manager.broadcast(json.dumps({
        "type": "identity_change",
        "user_id": current_user.id,
        "new_public_key": key_data.public_key
    }))
    
    return {"detail": "Identity reset successful. Peers notified."}