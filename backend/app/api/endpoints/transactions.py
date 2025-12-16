from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate

router = APIRouter()

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    transaction_in: TransactionCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new transaction.
    """
    db_transaction = Transaction(**transaction_in.model_dump(), user_id=current_user.id)
    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction

@router.get("/", response_model=List[TransactionResponse])
async def read_transactions(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve transactions.
    """
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    transactions = result.scalars().all()
    return transactions

@router.get("/{id}", response_model=TransactionResponse)
async def read_transaction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get transaction by ID.
    """
    result = await db.execute(
        select(Transaction)
        .where(Transaction.id == id, Transaction.user_id == current_user.id)
    )
    transaction = result.scalars().first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/{id}", response_model=TransactionResponse)
async def update_transaction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    transaction_in: TransactionUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a transaction.
    """
    result = await db.execute(
        select(Transaction)
        .where(Transaction.id == id, Transaction.user_id == current_user.id)
    )
    transaction = result.scalars().first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = transaction_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction

@router.delete("/{id}", response_model=TransactionResponse)
async def delete_transaction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a transaction.
    """
    result = await db.execute(
        select(Transaction)
        .where(Transaction.id == id, Transaction.user_id == current_user.id)
    )
    transaction = result.scalars().first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await db.delete(transaction)
    await db.commit()
    return transaction
