from fastapi import APIRouter
from app.api.endpoints import auth, users, categories, transactions, budgets, fixed_expenses, debts, incomes, savings, health


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(fixed_expenses.router, prefix="/fixed-expenses", tags=["fixed-expenses"])
api_router.include_router(debts.router, prefix="/debts", tags=["debts"])
api_router.include_router(incomes.router, prefix="/incomes", tags=["incomes"])
api_router.include_router(savings.router, prefix="/savings", tags=["savings"])
api_router.include_router(health.router, prefix="/health", tags=["health"])


