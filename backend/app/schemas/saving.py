from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class SavingBase(BaseModel):
    name: str
    amount: Decimal
    saving_date: date

class SavingCreate(SavingBase):
    pass

class SavingUpdate(SavingBase):
    pass

class SavingResponse(SavingBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
