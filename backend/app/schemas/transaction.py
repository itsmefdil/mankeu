from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class TransactionBase(BaseModel):
    category_id: int
    name: str
    transaction_date: date
    amount: Decimal
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    # We might want to include category details here later

    class Config:
        from_attributes = True
