from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
if settings.CORS_ALLOW_ALL_ORIGINS:
    # Allow all origins (development mode)
    origins = ["*"]
else:
    # Use specific origins from settings
    origins = []
    if settings.BACKEND_CORS_ORIGINS:
        origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
    
    # Explicitly add development origins if not already present
    dev_origins = ["http://localhost:5173", "http://localhost:8000"]
    for origin in dev_origins:
        if origin not in origins:
            origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to Mankeu API"}

from app.api.api import api_router

app.include_router(api_router, prefix=settings.API_V1_STR)

