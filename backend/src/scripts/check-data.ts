import { db } from '../lib/db';
import { users, transactions, categories } from '../db/schema';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    console.log('🔍 Checking database content...');

    try {
        const userCount = await db.select({ count: sql`count(*)` }).from(users);
        console.log(`Users: ${userCount[0].count}`);

        const allUsers = await db.select().from(users);
        for (const user of allUsers) {
            console.log(`\nUser: ${user.name} (ID: ${user.id}, Email: ${user.email})`);

            const txCount = await db.select({ count: sql`count(*)` }).from(transactions).where(sql`user_id = ${user.id}`);
            console.log(` - Transactions: ${txCount[0].count}`);

            const catCount = await db.select({ count: sql`count(*)` }).from(categories); // Categories are global usually? Or user specific?
            // Schema has no user_id for categories? Let's check schema.
            // Wait, existing schema.ts for categories should be checked.

            // Checking simple counts first
        }

    } catch (e) {
        console.error('Error checking DB:', e);
    }

    process.exit(0);
};

run();
