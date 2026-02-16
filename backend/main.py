from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import users, chat,presence  # Import the chat router
from config import ALLOWED_ORIGINS

# Create the database tables in PostgreSQL
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="E2EE Chat App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
# Adding tags and prefixes makes Swagger UI much cleaner
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(presence.router, prefix="/presence", tags=["Presence"])

@app.get("/")
def root():
    return {"message": "E2EE Chat Server is running"}