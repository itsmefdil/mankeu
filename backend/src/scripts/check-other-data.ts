import { db } from '../lib/db';
import { users, savings, monthlyBudgets } from '../db/schema';
import { sql, eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    console.log('🔍 Checking Budgets & Savings data...');

    try {
        const allUsers = await db.select().from(users);
        for (const user of allUsers) {
            console.log(`\nUser: ${user.name} (ID: ${user.id}, Email: ${user.email})`);

            const budgetCount = await db.select({ count: sql`count(*)` }).from(monthlyBudgets).where(eq(monthlyBudgets.userId, user.id));
            const savingsCount = await db.select({ count: sql`count(*)` }).from(savings).where(eq(savings.userId, user.id));

            console.log(` - Budgets: ${budgetCount[0].count}`);
            console.log(` - Savings/Goals: ${savingsCount[0].count}`);

            // Inspect one budget item to check fields
            if (Number(budgetCount[0].count) > 0) {
                const [budget] = await db.select().from(monthlyBudgets).where(eq(monthlyBudgets.userId, user.id)).limit(1);
                console.log(' - Sample Budget:', budget);
            }
        }

    } catch (e) {
        console.error('Error checking DB:', e);
    }

    process.exit(0);
};

run();
