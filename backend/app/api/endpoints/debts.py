from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.debt import Debt
from app.models.user import User
from app.schemas.debt import DebtCreate, DebtResponse, DebtUpdate

router = APIRouter()

@router.post("/", response_model=DebtResponse)
async def create_debt(
    *,
    db: AsyncSession = Depends(deps.get_db),
    debt_in: DebtCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new debt.
    """
    db_debt = Debt(**debt_in.model_dump(), user_id=current_user.id)
    db.add(db_debt)
    await db.commit()
    await db.refresh(db_debt)
    return db_debt

@router.get("/", response_model=List[DebtResponse])
async def read_debts(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve debts.
    """
    try:
        result = await db.execute(
            select(Debt)
            .where(Debt.user_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        debts = result.scalars().all()
        return debts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=DebtResponse)
async def read_debt(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get debt by ID.
    """
    result = await db.execute(
        select(Debt)
        .where(Debt.id == id, Debt.user_id == current_user.id)
    )
    debt = result.scalars().first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    return debt

@router.put("/{id}", response_model=DebtResponse)
async def update_debt(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    debt_in: DebtUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a debt.
    """
    result = await db.execute(
        select(Debt)
        .where(Debt.id == id, Debt.user_id == current_user.id)
    )
    debt = result.scalars().first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    update_data = debt_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(debt, field, value)
    
    db.add(debt)
    await db.commit()
    await db.refresh(debt)
    return debt

@router.delete("/{id}", response_model=DebtResponse)
async def delete_debt(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a debt.
    """
    result = await db.execute(
        select(Debt)
        .where(Debt.id == id, Debt.user_id == current_user.id)
    )
    debt = result.scalars().first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    await db.delete(debt)
    await db.commit()
    return debt
