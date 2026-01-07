import { Router } from 'express';
import { db } from '../lib/db';
import { transactions, savings, categories } from '../db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const transactionSchema = z.object({
    category_id: z.coerce.number(),
    name: z.string().min(1),
    transaction_date: z.string(), // ISO date string
    amount: z.union([z.string(), z.number()]),
    notes: z.string().optional().nullable(),
    goal_id: z.coerce.number().optional().nullable(),
});

const bulkDeleteSchema = z.object({
    ids: z.array(z.number()),
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;

    const result = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
        .limit(limit)
        .offset(skip);

    const formattedResult = result.map(t => ({
        id: t.id,
        user_id: t.userId,
        category_id: t.categoryId,
        name: t.name,
        transaction_date: t.transactionDate,
        amount: Number(t.amount),
        notes: t.notes,
        goal_id: t.goalId,
        created_at: t.createdAt
    }));

    res.json(formattedResult);
});

router.get('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [transaction] = await db.select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (!transaction) {
        return res.status(404).json({ detail: 'Transaction not found' });
    }
    res.json(transaction);
});

router.post('/', validate(transactionSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    // Create transaction
    const [newTransaction] = await db.insert(transactions).values({
        userId,
        categoryId: body.category_id,
        name: body.name,
        transactionDate: body.transaction_date,
        amount: String(body.amount),
        notes: body.notes,
        goalId: body.goal_id,
    }).returning();

    // Goal Sync
    if (body.goal_id) {
        const [category] = await db.select().from(categories).where(eq(categories.id, body.category_id));

        if (category && category.type === 'saving') {
            const [saving] = await db.select().from(savings).where(eq(savings.id, body.goal_id));
            if (saving) {
                await db.update(savings)
                    .set({ amount: String(Number(saving.amount) + Number(body.amount)) })
                    .where(eq(savings.id, saving.id));
            }
        }
    }

    if (!newTransaction) {
        return res.status(500).json({ detail: 'Failed to create transaction' });
    }

    res.json({
        id: newTransaction.id,
        user_id: newTransaction.userId,
        category_id: newTransaction.categoryId,
        name: newTransaction.name,
        transaction_date: newTransaction.transactionDate,
        amount: Number(newTransaction.amount),
        notes: newTransaction.notes,
        goal_id: newTransaction.goalId,
        created_at: newTransaction.createdAt
    });
});

router.put('/:id', validate(transactionSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;

    const [oldTransaction] = await db.select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (!oldTransaction) {
        return res.status(404).json({ detail: 'Transaction not found' });
    }

    const oldGoalId = oldTransaction.goalId;
    const oldAmount = Number(oldTransaction.amount);

    const [updatedTransaction] = await db.update(transactions)
        .set({
            categoryId: body.category_id,
            name: body.name,
            transactionDate: body.transaction_date,
            amount: String(body.amount),
            notes: body.notes,
            goalId: body.goal_id,
        })
        .where(eq(transactions.id, id))
        .returning();

    // Goal Sync Logic
    const newGoalId = body.goal_id;
    const newAmount = Number(body.amount);

    // 1. Revert Old Goal
    if (oldGoalId) {
        const [oldSaving] = await db.select().from(savings).where(eq(savings.id, oldGoalId));
        if (oldSaving) {
            await db.update(savings)
                .set({ amount: String(Number(oldSaving.amount) - oldAmount) })
                .where(eq(savings.id, oldGoalId));
        }
    }

    // 2. Apply New Goal
    if (newGoalId) {
        const [newSaving] = await db.select().from(savings).where(eq(savings.id, newGoalId));
        if (newSaving) {
            await db.update(savings)
                .set({ amount: String(Number(newSaving.amount) + newAmount) })
                .where(eq(savings.id, newGoalId));
        }
    }

    if (!updatedTransaction) {
        return res.status(500).json({ detail: 'Failed to update transaction' });
    }

    res.json({
        id: updatedTransaction.id,
        user_id: updatedTransaction.userId,
        category_id: updatedTransaction.categoryId,
        name: updatedTransaction.name,
        transaction_date: updatedTransaction.transactionDate,
        amount: Number(updatedTransaction.amount),
        notes: updatedTransaction.notes,
        goal_id: updatedTransaction.goalId,
        created_at: updatedTransaction.createdAt
    });
});

router.delete('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [transaction] = await db.select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (!transaction) {
        return res.status(404).json({ detail: 'Transaction not found' });
    }

    // Handle Goal Sync (Revert)
    if (transaction.goalId) {
        const [saving] = await db.select().from(savings).where(eq(savings.id, transaction.goalId));
        if (saving) {
            await db.update(savings)
                .set({ amount: String(Number(saving.amount) - Number(transaction.amount)) })
                .where(eq(savings.id, transaction.goalId));
        }
    }

    await db.delete(transactions).where(eq(transactions.id, id));
    res.json({
        id: transaction.id,
        user_id: transaction.userId,
        category_id: transaction.categoryId,
        name: transaction.name,
        transaction_date: transaction.transactionDate,
        amount: Number(transaction.amount),
        notes: transaction.notes,
        goal_id: transaction.goalId,
        created_at: transaction.createdAt
    });
});

router.post('/bulk-delete', validate(bulkDeleteSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const { ids } = req.body;

    const transactionsToDelete = await db.select()
        .from(transactions)
        .where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)));

    if (transactionsToDelete.length === 0) {
        return res.status(404).json({ detail: 'No transactions found to delete' });
    }

    for (const transaction of transactionsToDelete) {
        if (transaction.goalId) {
            const [saving] = await db.select().from(savings).where(eq(savings.id, transaction.goalId));
            if (saving) {
                await db.update(savings)
                    .set({ amount: String(Number(saving.amount) - Number(transaction.amount)) })
                    .where(eq(savings.id, transaction.goalId));
            }
        }
        await db.delete(transactions).where(eq(transactions.id, transaction.id));
    }

    res.status(204).send();
});

export default router;
