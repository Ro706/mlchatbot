import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///complaints.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    CORS_HEADERS = "Content-Type"
