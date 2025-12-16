from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.budget import MonthlyBudget
from app.models.user import User
from app.schemas.budget import MonthlyBudgetCreate, MonthlyBudgetResponse, MonthlyBudgetUpdate

router = APIRouter()

@router.post("/", response_model=MonthlyBudgetResponse)
async def create_budget(
    *,
    db: AsyncSession = Depends(deps.get_db),
    budget_in: MonthlyBudgetCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new monthly budget.
    """
    db_budget = MonthlyBudget(**budget_in.model_dump(), user_id=current_user.id)
    db.add(db_budget)
    await db.commit()
    await db.refresh(db_budget)
    return db_budget

@router.get("/", response_model=List[MonthlyBudgetResponse])
async def read_budgets(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve budgets.
    """
    result = await db.execute(
        select(MonthlyBudget)
        .where(MonthlyBudget.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    budgets = result.scalars().all()
    return budgets

@router.get("/{id}", response_model=MonthlyBudgetResponse)
async def read_budget(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get budget by ID.
    """
    result = await db.execute(
        select(MonthlyBudget)
        .where(MonthlyBudget.id == id, MonthlyBudget.user_id == current_user.id)
    )
    budget = result.scalars().first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget

@router.put("/{id}", response_model=MonthlyBudgetResponse)
async def update_budget(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    budget_in: MonthlyBudgetUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a budget.
    """
    result = await db.execute(
        select(MonthlyBudget)
        .where(MonthlyBudget.id == id, MonthlyBudget.user_id == current_user.id)
    )
    budget = result.scalars().first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    update_data = budget_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return budget

@router.delete("/{id}", response_model=MonthlyBudgetResponse)
async def delete_budget(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a budget.
    """
    result = await db.execute(
        select(MonthlyBudget)
        .where(MonthlyBudget.id == id, MonthlyBudget.user_id == current_user.id)
    )
    budget = result.scalars().first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    await db.delete(budget)
    await db.commit()
    return budget
