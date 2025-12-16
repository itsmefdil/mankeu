from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from app.models.debt import DebtStatus

class DebtBase(BaseModel):
    name: str
    amount: Decimal
    status: DebtStatus
    due_date: date

class DebtCreate(DebtBase):
    pass

class DebtUpdate(DebtBase):
    pass

class DebtResponse(DebtBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
