from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    picture = Column(String(500), nullable=True)
    given_name = Column(String(100), nullable=True)
    family_name = Column(String(100), nullable=True)
    locale = Column(String(10), nullable=True)

    # Relationships
    transactions = relationship("Transaction", back_populates="user")
    incomes = relationship("Income", back_populates="user")
    savings = relationship("Saving", back_populates="user")
    debts = relationship("Debt", back_populates="user")
    fixed_expenses = relationship("FixedExpense", back_populates="user")
    monthly_budgets = relationship("MonthlyBudget", back_populates="user")
