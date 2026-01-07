import { Hono } from 'hono';
import { db } from '../lib/db';
import { incomes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

const incomeSchema = z.object({
    source: z.string().min(1),
    amount: z.number(),
    income_date: z.string(), // ISO date
});

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const limit = Number(c.req.query('limit')) || 100;
    const skip = Number(c.req.query('skip')) || 0;

    const result = await db.select()
        .from(incomes)
        .where(eq(incomes.userId, userId))
        .limit(limit)
        .offset(skip);

    const formattedResult = result.map(i => ({
        id: i.id,
        user_id: i.userId,
        source: i.source,
        amount: Number(i.amount),
        income_date: i.incomeDate,
        created_at: i.createdAt
    }));

    return c.json(formattedResult);
});

app.get('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [income] = await db.select()
        .from(incomes)
        .where(and(eq(incomes.id, id), eq(incomes.userId, userId)));

    if (!income) {
        return c.json({ detail: 'Income not found' }, 404);
    }
    return c.json({
        id: income.id,
        user_id: income.userId,
        source: income.source,
        amount: Number(income.amount),
        income_date: income.incomeDate,
        created_at: income.createdAt
    });
});

app.post('/', zValidator('json', incomeSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const body = c.req.valid('json');

    const [newIncome] = await db.insert(incomes).values({
        userId,
        source: body.source,
        amount: String(body.amount),
        incomeDate: body.income_date,
    }).returning();

    return c.json({
        id: newIncome.id,
        user_id: newIncome.userId,
        source: newIncome.source,
        amount: Number(newIncome.amount),
        income_date: newIncome.incomeDate,
        created_at: newIncome.createdAt
    });
});

app.put('/:id', zValidator('json', incomeSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');

    const [updatedIncome] = await db.update(incomes)
        .set({
            source: body.source,
            amount: String(body.amount),
            incomeDate: body.income_date,
        })
        .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
        .returning();

    if (!updatedIncome) {
        return c.json({ detail: 'Income not found' }, 404);
    }
    return c.json({
        id: updatedIncome.id,
        user_id: updatedIncome.userId,
        source: updatedIncome.source,
        amount: Number(updatedIncome.amount),
        income_date: updatedIncome.incomeDate,
        created_at: updatedIncome.createdAt
    });
});

app.delete('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [deletedIncome] = await db.delete(incomes)
        .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
        .returning();

    if (!deletedIncome) {
        return c.json({ detail: 'Income not found' }, 404);
    }
    return c.json({
        id: deletedIncome.id,
        user_id: deletedIncome.userId,
        source: deletedIncome.source,
        amount: Number(deletedIncome.amount),
        income_date: deletedIncome.incomeDate,
        created_at: deletedIncome.createdAt
    });
});

export default app;
