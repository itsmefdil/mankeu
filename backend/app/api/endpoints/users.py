from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.core import security
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def create_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this user name already exists in the system",
        )
    
    # Create user
    db_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        name=user_in.name,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.get("/me", response_model=UserResponse)
async def read_user_me(
    response: Response,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    # Refresh token (sliding session)
    new_token = security.create_access_token(current_user.id)
    response.headers["x-new-token"] = new_token
    return current_user

@router.get("/", response_model=List[UserResponse])
async def read_users(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user), # Protect list users
) -> Any:
    """
    Retrieve users.
    """
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users
