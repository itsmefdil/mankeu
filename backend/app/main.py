from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys
import os
import logging
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection established successfully.")
    except Exception as e:
        print("\n\033[91m" + "!" * 60)
        print("FATAL ERROR: DATABASE CONNECTION FAILED".center(60))
        print("!" * 60 + "\033[0m")
        
        db_host = settings.DATABASE_URL.split("@")[1] if "@" in settings.DATABASE_URL else "Unknown Host"
        print(f"\nTarget Database: {db_host}")
        
        print("-" * 60)
        print(f"Error Details:")
        print(f"{str(e)}")
        print("-" * 60)
        
        print("Please check that:")
        print("1. The database server is running")
        print("2. The credentials in .env are correct")
        print("3. The database exists")
        
        print("\033[91m" + "!" * 60 + "\033[0m\n")
        print("\033[91m" + "!" * 60 + "\033[0m\n")
        # Use os._exit(1) to force exit without raising SystemExit, 
        # avoiding the messy traceback from Uvicorn/FastAPI
        os._exit(1)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS
# Configure CORS
if settings.CORS_ALLOW_ALL_ORIGINS:
    # Allow all origins (development mode)
    # Using regex=".*" allows credentials with all origins, which "*" does not support
    allow_origin_regex = ".*"
    origins = []
else:
    allow_origin_regex = None
    # Use specific origins from settings
    origins = []
    if settings.BACKEND_CORS_ORIGINS:
        origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
    


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to Mankeu API"}

from app.api.api import api_router

app.include_router(api_router, prefix=settings.API_V1_STR)

