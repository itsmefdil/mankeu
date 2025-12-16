import enum
from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, Date, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class DebtStatus(str, enum.Enum):
    unpaid = "unpaid"
    paid = "paid"

class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    status = Column(Enum(DebtStatus), default=DebtStatus.unpaid, nullable=False)
    due_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="debts")
