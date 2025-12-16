from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class IncomeBase(BaseModel):
    source: str
    amount: Decimal
    income_date: date

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(IncomeBase):
    pass

class IncomeResponse(IncomeBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
