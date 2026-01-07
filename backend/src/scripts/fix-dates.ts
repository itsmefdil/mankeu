
import { db } from '../lib/db';
import { transactions, incomes, savings } from '../db/schema';
import { eq } from 'drizzle-orm';

const INCORRECT_DATE = '2025-12-31';
const CORRECT_DATE = '2026-01-01';

async function fixDates() {
    console.log(`Starting date fix... Replacing ${INCORRECT_DATE} with ${CORRECT_DATE}`);

    // Fix Transactions
    const affectedTransactions = await db.select().from(transactions).where(eq(transactions.transactionDate, INCORRECT_DATE));
    console.log(`Found ${affectedTransactions.length} transactions to update.`);
    if (affectedTransactions.length > 0) {
        await db.update(transactions)
            .set({ transactionDate: CORRECT_DATE })
            .where(eq(transactions.transactionDate, INCORRECT_DATE));
        console.log('Transactions updated.');
    }

    // Fix Incomes
    const affectedIncomes = await db.select().from(incomes).where(eq(incomes.incomeDate, INCORRECT_DATE));
    console.log(`Found ${affectedIncomes.length} incomes to update.`);
    if (affectedIncomes.length > 0) {
        await db.update(incomes)
            .set({ incomeDate: CORRECT_DATE })
            .where(eq(incomes.incomeDate, INCORRECT_DATE));
        console.log('Incomes updated.');
    }

    // Fix Savings (Goal created date or target date? Model says saving_date)
    // Assuming saving_date is the date the saving was recorded/planned, similar to others.
    const affectedSavings = await db.select().from(savings).where(eq(savings.savingDate, INCORRECT_DATE));
    console.log(`Found ${affectedSavings.length} savings to update.`);
    if (affectedSavings.length > 0) {
        await db.update(savings)
            .set({ savingDate: CORRECT_DATE })
            .where(eq(savings.savingDate, INCORRECT_DATE));
        console.log('Savings updated.');
    }



    console.log('Date fix completed.');
    process.exit(0);
}

fixDates().catch((err) => {
    console.error('Error fixing dates:', err);
    process.exit(1);
});
