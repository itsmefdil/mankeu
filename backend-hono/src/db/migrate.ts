import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const runMigrate = async () => {
    const connectionString = process.env.DATABASE_URL!;

    // Neon typically requires SSL. postgres.js handles 'ssl=true' in URL, 
    // or we can force it here if using the options object.
    // For migration, we use a dedicated connection (max 1) to avoid issues.
    const sql = postgres(connectionString, {
        max: 1,
        ssl: 'require', // Force SSL for Neon
    });

    const db = drizzle(sql);

    console.log('⏳ Running migrations...');

    const start = Date.now();
    await migrate(db, { migrationsFolder: 'drizzle' });
    const end = Date.now();

    console.log(`✅ Migrations completed in ${end - start}ms`);

    await sql.end();
    process.exit(0);
};

runMigrate().catch((err) => {
    console.error('❌ Migration failed');
    console.error(err);
    process.exit(1);
});
