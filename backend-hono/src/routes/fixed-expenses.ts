import { Router } from 'express';
import { db } from '../lib/db';
import { fixedExpenses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const fixedExpenseSchema = z.object({
    name: z.string().min(1),
    amount: z.number(), // or string
    due_day: z.number().min(1).max(31),
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;

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

    res.json(formattedResult);
});

router.get('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [expense] = await db.select()
        .from(fixedExpenses)
        .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)));

    if (!expense) {
        return res.status(404).json({ detail: 'Fixed Expense not found' });
    }
    res.json({
        id: expense.id,
        user_id: expense.userId,
        name: expense.name,
        amount: Number(expense.amount),
        due_day: expense.dueDay,
        created_at: expense.createdAt
    });
});

router.post('/', validate(fixedExpenseSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    const [newExpense] = await db.insert(fixedExpenses).values({
        userId,
        name: body.name,
        amount: String(body.amount),
        dueDay: body.due_day,
    }).returning();

    res.json({
        id: newExpense.id,
        user_id: newExpense.userId,
        name: newExpense.name,
        amount: Number(newExpense.amount),
        due_day: newExpense.dueDay,
        created_at: newExpense.createdAt
    });
});

router.put('/:id', validate(fixedExpenseSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;

    const [updatedExpense] = await db.update(fixedExpenses)
        .set({
            name: body.name,
            amount: String(body.amount),
            dueDay: body.due_day,
        })
        .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
        .returning();

    if (!updatedExpense) {
        return res.status(404).json({ detail: 'Fixed Expense not found' });
    }
    res.json({
        id: updatedExpense.id,
        user_id: updatedExpense.userId,
        name: updatedExpense.name,
        amount: Number(updatedExpense.amount),
        due_day: updatedExpense.dueDay,
        created_at: updatedExpense.createdAt
    });
});

router.delete('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [deletedExpense] = await db.delete(fixedExpenses)
        .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
        .returning();

    if (!deletedExpense) {
        return res.status(404).json({ detail: 'Fixed Expense not found' });
    }
    res.json({
        id: deletedExpense.id,
        user_id: deletedExpense.userId,
        name: deletedExpense.name,
        amount: Number(deletedExpense.amount),
        due_day: deletedExpense.dueDay,
        created_at: deletedExpense.createdAt
    });
});

export default router;
