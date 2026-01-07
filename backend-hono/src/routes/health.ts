import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
    return c.json({ status: 'ok' });
});

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

app.get('/connection', async (c) => {
    try {
        await db.execute(sql`SELECT 1`);
        return c.json({ status: 'ok', database: 'connected' });
    } catch (e) {
        return c.json({ status: 'error', database: 'disconnected', detail: String(e) }, 500);
    }
});

export default app;
