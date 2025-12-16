from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.fixed_expense import FixedExpense
from app.models.user import User
from app.schemas.fixed_expense import FixedExpenseCreate, FixedExpenseResponse, FixedExpenseUpdate

router = APIRouter()

@router.post("/", response_model=FixedExpenseResponse)
async def create_fixed_expense(
    *,
    db: AsyncSession = Depends(deps.get_db),
    expense_in: FixedExpenseCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new fixed expense.
    """
    db_expense = FixedExpense(**expense_in.model_dump(), user_id=current_user.id)
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

@router.get("/", response_model=List[FixedExpenseResponse])
async def read_fixed_expenses(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve fixed expenses.
    """
    result = await db.execute(
        select(FixedExpense)
        .where(FixedExpense.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    expenses = result.scalars().all()
    return expenses

@router.get("/{id}", response_model=FixedExpenseResponse)
async def read_fixed_expense(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get fixed expense by ID.
    """
    result = await db.execute(
        select(FixedExpense)
        .where(FixedExpense.id == id, FixedExpense.user_id == current_user.id)
    )
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Fixed Expense not found")
    return expense

@router.put("/{id}", response_model=FixedExpenseResponse)
async def update_fixed_expense(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    expense_in: FixedExpenseUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a fixed expense.
    """
    result = await db.execute(
        select(FixedExpense)
        .where(FixedExpense.id == id, FixedExpense.user_id == current_user.id)
    )
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Fixed Expense not found")
    
    update_data = expense_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
    
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense

@router.delete("/{id}", response_model=FixedExpenseResponse)
async def delete_fixed_expense(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a fixed expense.
    """
    result = await db.execute(
        select(FixedExpense)
        .where(FixedExpense.id == id, FixedExpense.user_id == current_user.id)
    )
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Fixed Expense not found")
    
    await db.delete(expense)
    await db.commit()
    return expense
