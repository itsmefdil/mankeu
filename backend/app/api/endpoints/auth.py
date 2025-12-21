from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.core import security
from app.models.user import User
from app.schemas.token import Token
from app.schemas.google import GoogleLoginRequest
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Find user by email (username field in form_data)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    return {
        "access_token": security.create_access_token(user.id),
        "token_type": "bearer",
    }

@router.post("/login/google", response_model=Token)
async def login_google(
    request: GoogleLoginRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Login with Google ID Token.
    Verifies the token and finds/creates the user.
    """
    try:
        # Verify the token
        # Specify the CLIENT_ID of the app that accesses the backend:
        # id_info = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        # For now, we allow any valid Google Token since we might have multiple Clients (Web/Android)
        # In production, check against your specific client IDs.
        
        id_info = id_token.verify_oauth2_token(request.id_token, google_requests.Request())

        email = id_info.get("email")
        name = id_info.get("name")
        
        if not email:
             raise HTTPException(status_code=400, detail="Invalid Google Token: No email found")

    except ValueError:
        # Invalid token
        raise HTTPException(status_code=400, detail="Invalid Google Token")

    # Find user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        # Create new user
        # Generate a random password since they use Google
        import secrets
        random_password = secrets.token_urlsafe(16)
        
        user = User(
            email=email,
            name=name if name else email.split("@")[0],
            hashed_password=security.get_password_hash(random_password)
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return {
        "access_token": security.create_access_token(user.id),
        "token_type": "bearer",
    }
