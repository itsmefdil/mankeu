import { Router } from 'express';
import { db } from '../lib/db';
import { incomes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const incomeSchema = z.object({
    source: z.string().min(1),
    amount: z.number(),
    income_date: z.string(), // ISO date
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;

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

    res.json(formattedResult);
});

router.get('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [income] = await db.select()
        .from(incomes)
        .where(and(eq(incomes.id, id), eq(incomes.userId, userId)));

    if (!income) {
        return res.status(404).json({ detail: 'Income not found' });
    }
    res.json({
        id: income.id,
        user_id: income.userId,
        source: income.source,
        amount: Number(income.amount),
        income_date: income.incomeDate,
        created_at: income.createdAt
    });
});

router.post('/', validate(incomeSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    const [newIncome] = await db.insert(incomes).values({
        userId,
        source: body.source,
        amount: String(body.amount),
        incomeDate: body.income_date,
    }).returning();

    res.json({
        id: newIncome.id,
        user_id: newIncome.userId,
        source: newIncome.source,
        amount: Number(newIncome.amount),
        income_date: newIncome.incomeDate,
        created_at: newIncome.createdAt
    });
});

router.put('/:id', validate(incomeSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;

    const [updatedIncome] = await db.update(incomes)
        .set({
            source: body.source,
            amount: String(body.amount),
            incomeDate: body.income_date,
        })
        .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
        .returning();

    if (!updatedIncome) {
        return res.status(404).json({ detail: 'Income not found' });
    }
    res.json({
        id: updatedIncome.id,
        user_id: updatedIncome.userId,
        source: updatedIncome.source,
        amount: Number(updatedIncome.amount),
        income_date: updatedIncome.incomeDate,
        created_at: updatedIncome.createdAt
    });
});

router.delete('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [deletedIncome] = await db.delete(incomes)
        .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
        .returning();

    if (!deletedIncome) {
        return res.status(404).json({ detail: 'Income not found' });
    }
    res.json({
        id: deletedIncome.id,
        user_id: deletedIncome.userId,
        source: deletedIncome.source,
        amount: Number(deletedIncome.amount),
        income_date: deletedIncome.incomeDate,
        created_at: deletedIncome.createdAt
    });
});

export default router;
