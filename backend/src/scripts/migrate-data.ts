import mysql from 'mysql2/promise';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

const MYSQL_URL = process.env.MYSQL_DATABASE_URL;

if (!MYSQL_URL) {
    console.error('❌ MYSQL_DATABASE_URL is not set in .env');
    process.exit(1);
}

// Helper to format date for Postgres (YYYY-MM-DD)
// This is critical because postgres.js + Drizzle expects a string for 'date' columns, not a JS Date object.
const toDate = (d: any): string => {
    if (!d) return new Date().toISOString().split('T')[0];
    return new Date(d).toISOString().split('T')[0];
};

const run = async () => {
    console.log('🚀 Starting migration from MySQL to Postgres...');

    // Connect to MySQL
    const mysqlConn = await mysql.createConnection(MYSQL_URL);
    console.log('✅ Connected to MySQL');

    // Helper to fetch all rows
    const fetchRows = async (table: string) => {
        const [rows] = await mysqlConn.execute(`SELECT * FROM ${table}`);
        return rows as any[];
    };

    try {
        // 1. Users
        console.log('Migrating Users...');
        const users = await fetchRows('users');
        for (const row of users) {
            await db.insert(schema.users).values({
                id: row.id,
                name: row.name,
                email: row.email,
                hashedPassword: row.hashed_password,
                createdAt: new Date(row.created_at),
                picture: row.picture,
                givenName: row.given_name,
                familyName: row.family_name,
                locale: row.locale,
                currency: row.currency,
            }).onConflictDoNothing().execute();
        }
        console.log(`✓ Migrated ${users.length} users`);

        // 2. Categories
        console.log('Migrating Categories...');
        const categories = await fetchRows('categories');
        for (const row of categories) {
            await db.insert(schema.categories).values({
                id: row.id,
                name: row.name,
                type: row.type,
                createdAt: new Date(row.created_at),
            }).onConflictDoNothing().execute();
        }
        console.log(`✓ Migrated ${categories.length} categories`);

        // 3. Savings (Goals)
        console.log('Migrating Savings/Goals...');
        const savings = await fetchRows('savings');
        for (const row of savings) {
            await db.insert(schema.savings).values({
                id: row.id,
                userId: row.user_id,
                name: row.name,
                amount: String(row.amount),
                savingDate: toDate(row.saving_date), // Converted
                createdAt: new Date(row.created_at),
            }).onConflictDoNothing().execute();
        }
        console.log(`✓ Migrated ${savings.length} savings`);




        // 6. Incomes
        console.log('Migrating Incomes...');
        const incomes = await fetchRows('incomes');
        for (const row of incomes) {
            await db.insert(schema.incomes).values({
                id: row.id,
                userId: row.user_id,
                source: row.source,
                amount: String(row.amount),
                incomeDate: toDate(row.income_date), // Converted
                createdAt: new Date(row.created_at),
            }).onConflictDoNothing().execute();
        }
        console.log(`✓ Migrated ${incomes.length} incomes`);

        // 7. Monthly Budgets
        console.log('Migrating Monthly Budgets...');
        const budgets = await fetchRows('monthly_budgets');
        for (const row of budgets) {
            await db.insert(schema.monthlyBudgets).values({
                id: row.id,
                userId: row.user_id,
                categoryId: row.category_id,
                month: row.month,
                year: row.year,
                budgetAmount: String(row.budget_amount),
                createdAt: new Date(row.created_at),
            }).onConflictDoNothing().execute();
        }
        console.log(`✓ Migrated ${budgets.length} budgets`);

        // 8. Transactions
        console.log('Migrating Transactions...');
        const transactions = await fetchRows('transactions');
        for (const row of transactions) {
            await db.insert(schema.transactions).values({
                id: row.id,
                userId: row.user_id,
                categoryId: row.category_id,
                name: row.name,
                transactionDate: toDate(row.transaction_date), // Converted
                amount: String(row.amount),
                notes: row.notes,
                goalId: row.goal_id,
                createdAt: new Date(row.created_at),
            }).onConflictDoNothing().execute();
        }
        console.log(`✓ Migrated ${transactions.length} transactions`);

        // Reset sequences
        console.log('🔄 Resetting sequences...');
        await db.execute(sql`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users) + 1)`);
        await db.execute(sql`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories) + 1)`);
        await db.execute(sql`SELECT setval('savings_id_seq', (SELECT MAX(id) FROM savings) + 1)`);

        await db.execute(sql`SELECT setval('incomes_id_seq', (SELECT MAX(id) FROM incomes) + 1)`);
        await db.execute(sql`SELECT setval('monthly_budgets_id_seq', (SELECT MAX(id) FROM monthly_budgets) + 1)`);
        await db.execute(sql`SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions) + 1)`);

        console.log('✅ Migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mysqlConn.end();
        process.exit(0);
    }
};

run();
