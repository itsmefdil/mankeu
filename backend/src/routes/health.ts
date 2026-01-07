import { Router } from 'express';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

const router = Router();

router.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

router.get('/connection', async (req, res) => {
    try {
        await db.execute(sql`SELECT 1`);
        res.json({ status: 'ok', database: 'connected' });
    } catch (e) {
        res.status(500).json({ status: 'error', database: 'disconnected', detail: String(e) });
    }
});

export default router;
