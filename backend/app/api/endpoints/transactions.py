from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.transaction import Transaction
from app.models.user import User
from app.models.category import Category, CategoryType
from app.models.saving import Saving
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate, TransactionBulkDelete


router = APIRouter()

@router.post("/bulk-delete", status_code=204)
async def bulk_delete_transactions(
    *,
    db: AsyncSession = Depends(deps.get_db),
    delete_data: TransactionBulkDelete,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete multiple transactions.
    """
    # Fetch transactions to be deleted
    result = await db.execute(
        select(Transaction)
        .where(Transaction.id.in_(delete_data.ids), Transaction.user_id == current_user.id)
    )
    transactions = result.scalars().all()
    
    if not transactions:
        raise HTTPException(status_code=404, detail="No transactions found to delete")
        
    for transaction in transactions:
        # Handle Goal Sync (Revert/Subtract Amount)
        if transaction.goal_id:
            saving_res = await db.execute(select(Saving).where(Saving.id == transaction.goal_id))
            saving = saving_res.scalars().first()
            if saving:
                saving.amount = saving.amount - transaction.amount
                db.add(saving)
        
        await db.delete(transaction)
    
    await db.commit()
    return None



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
    # Create transaction (include goal_id if present)
    db_transaction = Transaction(**transaction_in.model_dump(), user_id=current_user.id)
    db.add(db_transaction)
    
    # Handle Saving Goal Update (Add Amount)
    if transaction_in.goal_id:
        result = await db.execute(select(Category).where(Category.id == transaction_in.category_id))
        category = result.scalars().first()
        
        if category and category.type == CategoryType.saving:
            saving_result = await db.execute(select(Saving).where(Saving.id == transaction_in.goal_id))
            saving = saving_result.scalars().first()
            if saving:
                saving.amount = saving.amount + transaction_in.amount
                db.add(saving)

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
    
    # Snapshot old state for goal sync
    old_goal_id = transaction.goal_id
    old_amount = transaction.amount
    
    # Update fields
    update_data = transaction_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
        
    # Handle Goal Sync Logic
    new_goal_id = transaction.goal_id
    new_amount = transaction.amount
    
    # 1. Revert Old Goal if it existed
    if old_goal_id:
        # Fetch old saving
        old_saving_res = await db.execute(select(Saving).where(Saving.id == old_goal_id))
        old_saving = old_saving_res.scalars().first()
        if old_saving:
            old_saving.amount = old_saving.amount - old_amount
            db.add(old_saving)

    # 2. Apply New Goal if it exists
    if new_goal_id:
        # Fetch new saving (might be same as old, but we already subtracted old amount, so adding new amount is correct)
        # However, if it's the SAME object in session, we need to be careful.
        # SQLAlchemy identity map handles this. If old_goal_id == new_goal_id, old_saving is the same instance.
        
        new_saving_res = await db.execute(select(Saving).where(Saving.id == new_goal_id))
        new_saving = new_saving_res.scalars().first()
        if new_saving:
            new_saving.amount = new_saving.amount + new_amount
            db.add(new_saving)
    
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
    
    # Handle Goal Sync (Revert/Subtract Amount)
    if transaction.goal_id:
        saving_res = await db.execute(select(Saving).where(Saving.id == transaction.goal_id))
        saving = saving_res.scalars().first()
        if saving:
            saving.amount = saving.amount - transaction.amount
            db.add(saving)
    
    await db.delete(transaction)
    await db.commit()
    return transaction
