from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class MonthlyBudgetBase(BaseModel):
    category_id: int
    month: int
    year: int
    budget_amount: Decimal

class MonthlyBudgetCreate(MonthlyBudgetBase):
    pass

class MonthlyBudgetUpdate(MonthlyBudgetBase):
    pass

class MonthlyBudgetResponse(MonthlyBudgetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
