from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.saving import Saving
from app.models.user import User
from app.schemas.saving import SavingCreate, SavingResponse, SavingUpdate

router = APIRouter()

@router.post("/", response_model=SavingResponse)
async def create_saving(
    *,
    db: AsyncSession = Depends(deps.get_db),
    saving_in: SavingCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new saving.
    """
    db_saving = Saving(**saving_in.model_dump(), user_id=current_user.id)
    db.add(db_saving)
    await db.commit()
    await db.refresh(db_saving)
    return db_saving

@router.get("/", response_model=List[SavingResponse])
async def read_savings(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve savings.
    """
    result = await db.execute(
        select(Saving)
        .where(Saving.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    savings = result.scalars().all()
    return savings

@router.get("/{id}", response_model=SavingResponse)
async def read_saving(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get saving by ID.
    """
    result = await db.execute(
        select(Saving)
        .where(Saving.id == id, Saving.user_id == current_user.id)
    )
    saving = result.scalars().first()
    if not saving:
        raise HTTPException(status_code=404, detail="Saving not found")
    return saving

@router.put("/{id}", response_model=SavingResponse)
async def update_saving(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    saving_in: SavingUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a saving.
    """
    result = await db.execute(
        select(Saving)
        .where(Saving.id == id, Saving.user_id == current_user.id)
    )
    saving = result.scalars().first()
    if not saving:
        raise HTTPException(status_code=404, detail="Saving not found")
    
    update_data = saving_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(saving, field, value)
    
    db.add(saving)
    await db.commit()
    await db.refresh(saving)
    return saving

@router.delete("/{id}", response_model=SavingResponse)
async def delete_saving(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a saving.
    """
    result = await db.execute(
        select(Saving)
        .where(Saving.id == id, Saving.user_id == current_user.id)
    )
    saving = result.scalars().first()
    if not saving:
        raise HTTPException(status_code=404, detail="Saving not found")
    
    await db.delete(saving)
    await db.commit()
    return saving
