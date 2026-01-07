import { Hono } from 'hono';
import { db } from '../lib/db';
import { monthlyBudgets } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

const budgetSchema = z.object({
    category_id: z.number(),
    month: z.number().min(1).max(12),
    year: z.number(),
    budget_amount: z.number(), // or string from frontend
});

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const limit = Number(c.req.query('limit')) || 100;
    const skip = Number(c.req.query('skip')) || 0;

    const result = await db.select()
        .from(monthlyBudgets)
        .where(eq(monthlyBudgets.userId, userId))
        .limit(limit)
        .offset(skip);

    const formattedResult = result.map(b => ({
        id: b.id,
        user_id: b.userId,
        category_id: b.categoryId,
        month: b.month,
        year: b.year,
        budget_amount: Number(b.budgetAmount),
        created_at: b.createdAt
    }));

    return c.json(formattedResult);
});

app.get('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [budget] = await db.select()
        .from(monthlyBudgets)
        .where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.userId, userId)));

    if (!budget) {
        return c.json({ detail: 'Budget not found' }, 404);
    }
    return c.json({
        id: budget.id,
        user_id: budget.userId,
        category_id: budget.categoryId,
        month: budget.month,
        year: budget.year,
        budget_amount: Number(budget.budgetAmount),
        created_at: budget.createdAt
    });
});

app.post('/', zValidator('json', budgetSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const body = c.req.valid('json');

    const [newBudget] = await db.insert(monthlyBudgets).values({
        userId,
        categoryId: body.category_id,
        month: body.month,
        year: body.year,
        budgetAmount: String(body.budget_amount),
    }).returning();

    return c.json({
        id: newBudget.id,
        user_id: newBudget.userId,
        category_id: newBudget.categoryId,
        month: newBudget.month,
        year: newBudget.year,
        budget_amount: Number(newBudget.budgetAmount),
        created_at: newBudget.createdAt
    });
});

app.put('/:id', zValidator('json', budgetSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');

    const [updatedBudget] = await db.update(monthlyBudgets)
        .set({
            categoryId: body.category_id,
            month: body.month,
            year: body.year,
            budgetAmount: String(body.budget_amount),
        })
        .where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.userId, userId)))
        .returning();

    if (!updatedBudget) {
        return c.json({ detail: 'Budget not found' }, 404);
    }
    return c.json({
        id: updatedBudget.id,
        user_id: updatedBudget.userId,
        category_id: updatedBudget.categoryId,
        month: updatedBudget.month,
        year: updatedBudget.year,
        budget_amount: Number(updatedBudget.budgetAmount),
        created_at: updatedBudget.createdAt
    });
});

app.delete('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [deletedBudget] = await db.delete(monthlyBudgets)
        .where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.userId, userId)))
        .returning();

    if (!deletedBudget) {
        return c.json({ detail: 'Budget not found' }, 404);
    }
    return c.json({
        id: deletedBudget.id,
        user_id: deletedBudget.userId,
        category_id: deletedBudget.categoryId,
        month: deletedBudget.month,
        year: deletedBudget.year,
        budget_amount: Number(deletedBudget.budgetAmount),
        created_at: deletedBudget.createdAt
    });
});

export default app;
