from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.income import Income
from app.models.user import User
from app.schemas.income import IncomeCreate, IncomeResponse, IncomeUpdate

router = APIRouter()

@router.post("/", response_model=IncomeResponse)
async def create_income(
    *,
    db: AsyncSession = Depends(deps.get_db),
    income_in: IncomeCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new income.
    """
    db_income = Income(**income_in.model_dump(), user_id=current_user.id)
    db.add(db_income)
    await db.commit()
    await db.refresh(db_income)
    return db_income

@router.get("/", response_model=List[IncomeResponse])
async def read_incomes(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve incomes.
    """
    result = await db.execute(
        select(Income)
        .where(Income.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    incomes = result.scalars().all()
    return incomes

@router.get("/{id}", response_model=IncomeResponse)
async def read_income(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get income by ID.
    """
    result = await db.execute(
        select(Income)
        .where(Income.id == id, Income.user_id == current_user.id)
    )
    income = result.scalars().first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return income

@router.put("/{id}", response_model=IncomeResponse)
async def update_income(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    income_in: IncomeUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update an income.
    """
    result = await db.execute(
        select(Income)
        .where(Income.id == id, Income.user_id == current_user.id)
    )
    income = result.scalars().first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    update_data = income_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(income, field, value)
    
    db.add(income)
    await db.commit()
    await db.refresh(income)
    return income

@router.delete("/{id}", response_model=IncomeResponse)
async def delete_income(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete an income.
    """
    result = await db.execute(
        select(Income)
        .where(Income.id == id, Income.user_id == current_user.id)
    )
    income = result.scalars().first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    await db.delete(income)
    await db.commit()
    return income
