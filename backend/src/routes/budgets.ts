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
    budget_amount: z.number().positive(),
    period_type: z.enum(['monthly', 'custom_range', 'yearly', 'forever']).default('monthly'),
    month: z.number().min(1).max(12).optional(),
    year: z.number().optional(),
    start_month: z.number().min(1).max(12).optional(),
    start_year: z.number().optional(),
    end_month: z.number().min(1).max(12).nullable().optional(),
    end_year: z.number().nullable().optional(),
});

function normalizeBudgetDates(body: z.infer<typeof budgetSchema>) {
    const current = new Date();
    const periodType = body.period_type || 'monthly';
    const startM = body.start_month ?? body.month ?? (current.getMonth() + 1);
    const startY = body.start_year ?? body.year ?? current.getFullYear();

    let endM: number | null = null;
    let endY: number | null = null;

    if (periodType === 'monthly') {
        endM = startM;
        endY = startY;
    } else if (periodType === 'yearly') {
        endM = 12;
        endY = startY;
    } else if (periodType === 'forever') {
        endM = null;
        endY = null;
    } else if (periodType === 'custom_range') {
        endM = body.end_month ?? startM;
        endY = body.end_year ?? startY;
    }

    return {
        month: startM,
        year: startY,
        periodType,
        startMonth: startM,
        startYear: startY,
        endMonth: endM,
        endYear: endY,
    };
}

function formatBudgetResponse(b: typeof monthlyBudgets.$inferSelect) {
    return {
        id: b.id,
        user_id: b.userId,
        category_id: b.categoryId,
        month: b.month,
        year: b.year,
        period_type: b.periodType,
        start_month: b.startMonth ?? b.month,
        start_year: b.startYear ?? b.year,
        end_month: b.endMonth,
        end_year: b.endYear,
        budget_amount: Number(b.budgetAmount),
        created_at: b.createdAt
    };
}

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

    const formattedResult = result.map(formatBudgetResponse);

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
    res.json(formatBudgetResponse(budget));
});

router.post('/', validate(budgetSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;
    const dates = normalizeBudgetDates(body);

    const [newBudget] = await db.insert(monthlyBudgets).values({
        userId,
        categoryId: body.category_id,
        month: dates.month,
        year: dates.year,
        periodType: dates.periodType,
        startMonth: dates.startMonth,
        startYear: dates.startYear,
        endMonth: dates.endMonth,
        endYear: dates.endYear,
        budgetAmount: String(body.budget_amount),
    }).returning();

    res.json(formatBudgetResponse(newBudget));
});

router.put('/:id', validate(budgetSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;
    const dates = normalizeBudgetDates(body);

    const [updatedBudget] = await db.update(monthlyBudgets)
        .set({
            categoryId: body.category_id,
            month: dates.month,
            year: dates.year,
            periodType: dates.periodType,
            startMonth: dates.startMonth,
            startYear: dates.startYear,
            endMonth: dates.endMonth,
            endYear: dates.endYear,
            budgetAmount: String(body.budget_amount),
        })
        .where(and(eq(monthlyBudgets.id, id), eq(monthlyBudgets.userId, userId)))
        .returning();

    if (!updatedBudget) {
        return res.status(404).json({ detail: 'Budget not found' });
    }
    res.json(formatBudgetResponse(updatedBudget));
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
