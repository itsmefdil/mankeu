import { Router } from 'express';
import { db } from '../lib/db';
import { monthlyBudgets } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const budgetSchema = z.object({
    category_id: z.number(),
    month: z.number().min(1).max(12),
    year: z.number(),
    budget_amount: z.number(),
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;

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

    res.json(formattedResult);
});

router.get('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [budget] = await db.select()
        .from(monthlyBudgets)
        .where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.userId, userId)));

    if (!budget) {
        return res.status(404).json({ detail: 'Budget not found' });
    }
    res.json({
        id: budget.id,
        user_id: budget.userId,
        category_id: budget.categoryId,
        month: budget.month,
        year: budget.year,
        budget_amount: Number(budget.budgetAmount),
        created_at: budget.createdAt
    });
});

router.post('/', validate(budgetSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    const [newBudget] = await db.insert(monthlyBudgets).values({
        userId,
        categoryId: body.category_id,
        month: body.month,
        year: body.year,
        budgetAmount: String(body.budget_amount),
    }).returning();

    res.json({
        id: newBudget.id,
        user_id: newBudget.userId,
        category_id: newBudget.categoryId,
        month: newBudget.month,
        year: newBudget.year,
        budget_amount: Number(newBudget.budgetAmount),
        created_at: newBudget.createdAt
    });
});

router.put('/:id', validate(budgetSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;

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
        return res.status(404).json({ detail: 'Budget not found' });
    }
    res.json({
        id: updatedBudget.id,
        user_id: updatedBudget.userId,
        category_id: updatedBudget.categoryId,
        month: updatedBudget.month,
        year: updatedBudget.year,
        budget_amount: Number(updatedBudget.budgetAmount),
        created_at: updatedBudget.createdAt
    });
});

router.delete('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [deletedBudget] = await db.delete(monthlyBudgets)
        .where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.userId, userId)))
        .returning();

    if (!deletedBudget) {
        return res.status(404).json({ detail: 'Budget not found' });
    }
    res.json({
        id: deletedBudget.id,
        user_id: deletedBudget.userId,
        category_id: deletedBudget.categoryId,
        month: deletedBudget.month,
        year: deletedBudget.year,
        budget_amount: Number(deletedBudget.budgetAmount),
        created_at: deletedBudget.createdAt
    });
});

export default router;
