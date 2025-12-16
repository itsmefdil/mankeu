import asyncio
from sqlalchemy import text
from app.core.database import engine

async def update_schema():
    async with engine.begin() as conn:
        try:
            print("Attempting to add goal_id column to transactions table...")
            await conn.execute(text("ALTER TABLE transactions ADD COLUMN goal_id INT NULL;"))
            print("Column added.")
            print("Attempting to add foreign key constraint...")
            await conn.execute(text("ALTER TABLE transactions ADD CONSTRAINT fk_transactions_goal FOREIGN KEY (goal_id) REFERENCES savings(id);"))
            print("Foreign key added.")
        except Exception as e:
            print(f"An error occurred (column might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
