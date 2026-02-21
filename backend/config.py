import os
from dotenv import load_dotenv

load_dotenv()

# No fallback for DATABASE_URL; it MUST be provided by Render
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set! The app cannot start.")

# No fallback for SECRET_KEY; ensure production security
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set! Security is compromised.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

# CORS Settings
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]