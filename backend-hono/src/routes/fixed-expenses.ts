import { Hono } from 'hono';
import { db } from '../lib/db';
import { fixedExpenses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

const fixedExpenseSchema = z.object({
    name: z.string().min(1),
    amount: z.number(), // or string
    due_day: z.number().min(1).max(31),
});

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const limit = Number(c.req.query('limit')) || 100;
    const skip = Number(c.req.query('skip')) || 0;

    const result = await db.select()
        .from(fixedExpenses)
        .where(eq(fixedExpenses.userId, userId))
        .limit(limit)
        .offset(skip);

    const formattedResult = result.map(e => ({
        id: e.id,
        user_id: e.userId,
        name: e.name,
        amount: Number(e.amount),
        due_day: e.dueDay,
        created_at: e.createdAt
    }));

    return c.json(formattedResult);
});

app.get('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [expense] = await db.select()
        .from(fixedExpenses)
        .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)));

    if (!expense) {
        return c.json({ detail: 'Fixed Expense not found' }, 404);
    }
    return c.json({
        id: expense.id,
        user_id: expense.userId,
        name: expense.name,
        amount: Number(expense.amount),
        due_day: expense.dueDay,
        created_at: expense.createdAt
    });
});

app.post('/', zValidator('json', fixedExpenseSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const body = c.req.valid('json');

    const [newExpense] = await db.insert(fixedExpenses).values({
        userId,
        name: body.name,
        amount: String(body.amount),
        dueDay: body.due_day,
    }).returning();

    return c.json({
        id: newExpense.id,
        user_id: newExpense.userId,
        name: newExpense.name,
        amount: Number(newExpense.amount),
        due_day: newExpense.dueDay,
        created_at: newExpense.createdAt
    });
});

app.put('/:id', zValidator('json', fixedExpenseSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');

    const [updatedExpense] = await db.update(fixedExpenses)
        .set({
            name: body.name,
            amount: String(body.amount),
            dueDay: body.due_day,
        })
        .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
        .returning();

    if (!updatedExpense) {
        return c.json({ detail: 'Fixed Expense not found' }, 404);
    }
    return c.json({
        id: updatedExpense.id,
        user_id: updatedExpense.userId,
        name: updatedExpense.name,
        amount: Number(updatedExpense.amount),
        due_day: updatedExpense.dueDay,
        created_at: updatedExpense.createdAt
    });
});

app.delete('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [deletedExpense] = await db.delete(fixedExpenses)
        .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
        .returning();

    if (!deletedExpense) {
        return c.json({ detail: 'Fixed Expense not found' }, 404);
    }
    return c.json({
        id: deletedExpense.id,
        user_id: deletedExpense.userId,
        name: deletedExpense.name,
        amount: Number(deletedExpense.amount),
        due_day: deletedExpense.dueDay,
        created_at: deletedExpense.createdAt
    });
});

export default app;
