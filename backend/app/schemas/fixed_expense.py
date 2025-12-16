from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class FixedExpenseBase(BaseModel):
    name: str
    amount: Decimal
    due_day: int

class FixedExpenseCreate(FixedExpenseBase):
    pass

class FixedExpenseUpdate(FixedExpenseBase):
    pass

class FixedExpenseResponse(FixedExpenseBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
