from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.category import CategoryType

class CategoryBase(BaseModel):
    name: str
    type: CategoryType

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
