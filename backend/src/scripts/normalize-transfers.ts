import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { transactions } from '../db/schema';
import { like, or } from 'drizzle-orm';

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const runNormalization = async () => {
    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    console.log('⏳ Normalizing transfer transactions...');

    const start = Date.now();

    const result = await db.update(transactions)
        .set({ isTransfer: true })
        .where(
            or(
                like(transactions.name, 'Transfer ke %'),
                like(transactions.name, 'Transfer dari %')
            )
        )
        .returning({ updatedId: transactions.id });

    const end = Date.now();

    console.log(`✅ Normalization completed in ${end - start}ms`);
    console.log(`Updated ${result.length} transactions.`);

    await sql.end();
    process.exit(0);
};

runNormalization().catch((err) => {
    console.error('❌ Normalization failed');
    console.error(err);
    process.exit(1);
});
