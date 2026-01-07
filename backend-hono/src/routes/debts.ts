import { Router } from 'express';
import { db } from '../lib/db';
import { debts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const debtSchema = z.object({
    name: z.string().min(1),
    amount: z.number(),
    status: z.enum(['unpaid', 'paid']).default('unpaid'),
    due_date: z.string(), // ISO date
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;

    const result = await db.select()
        .from(debts)
        .where(eq(debts.userId, userId))
        .limit(limit)
        .offset(skip);

    res.json(result);
});

router.get('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [debt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)));

    if (!debt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }
    res.json(debt);
});

router.post('/', validate(debtSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    const [newDebt] = await db.insert(debts).values({
        userId,
        name: body.name,
        amount: String(body.amount),
        status: body.status,
        dueDate: body.due_date,
    }).returning();

    res.json(newDebt);
});

router.put('/:id', validate(debtSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;

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
        return res.status(404).json({ detail: 'Debt not found' });
    }
    res.json(updatedDebt);
});

router.delete('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [deletedDebt] = await db.delete(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)))
        .returning();

    if (!deletedDebt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }
    res.json(deletedDebt);
});

export default router;
