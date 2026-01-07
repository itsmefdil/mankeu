import { Hono } from 'hono';
import { db } from '../lib/db';
import { debts, debtStatusEnum } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

const debtSchema = z.object({
    name: z.string().min(1),
    amount: z.number(),
    status: z.enum(['unpaid', 'paid']).default('unpaid'),
    due_date: z.string(), // ISO date
});

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const limit = Number(c.req.query('limit')) || 100;
    const skip = Number(c.req.query('skip')) || 0;

    const result = await db.select()
        .from(debts)
        .where(eq(debts.userId, userId))
        .limit(limit)
        .offset(skip);

    return c.json(result);
});

app.get('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [debt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)));

    if (!debt) {
        return c.json({ detail: 'Debt not found' }, 404);
    }
    return c.json(debt);
});

app.post('/', zValidator('json', debtSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const body = c.req.valid('json');

    const [newDebt] = await db.insert(debts).values({
        userId,
        name: body.name,
        amount: String(body.amount),
        status: body.status,
        dueDate: body.due_date,
    }).returning();

    return c.json(newDebt);
});

app.put('/:id', zValidator('json', debtSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');

    const [updatedDebt] = await db.update(debts)
        .set({
            name: body.name,
            amount: String(body.amount),
            status: body.status,
            dueDate: body.due_date,
        })
        .where(and(eq(debts.id, id), eq(debts.userId, userId)))
        .returning();

    if (!updatedDebt) {
        return c.json({ detail: 'Debt not found' }, 404);
    }
    return c.json(updatedDebt);
});

app.delete('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [deletedDebt] = await db.delete(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)))
        .returning();

    if (!deletedDebt) {
        return c.json({ detail: 'Debt not found' }, 404);
    }
    return c.json(deletedDebt);
});

export default app;
