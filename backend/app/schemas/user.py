from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

    locale: Optional[str] = 'id'
    currency: Optional[str] = 'IDR'

class UserUpdate(UserBase):
    password: Optional[str] = None
    locale: Optional[str] = None
    currency: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    picture: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    locale: Optional[str] = None
    currency: Optional[str] = None

    class Config:
        from_attributes = True
