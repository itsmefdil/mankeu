from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()

@router.post("/", response_model=CategoryResponse)
async def create_category(
    *,
    db: AsyncSession = Depends(deps.get_db),
    category_in: CategoryCreate,
) -> Any:
    """
    Create new category.
    """
    db_category = Category(**category_in.model_dump())
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[CategoryResponse])
async def read_categories(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve categories.
    """
    result = await db.execute(select(Category).offset(skip).limit(limit))
    categories = result.scalars().all()
    return categories

@router.get("/{id}", response_model=CategoryResponse)
async def read_category(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get category by ID.
    """
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{id}", response_model=CategoryResponse)
async def update_category(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    category_in: CategoryUpdate,
) -> Any:
    """
    Update a category.
    """
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/{id}", response_model=CategoryResponse)
async def delete_category(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Delete a category.
    """
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.delete(category)
    await db.commit()
    return category
