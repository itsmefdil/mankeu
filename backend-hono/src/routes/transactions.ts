import { Hono } from 'hono';
import { db } from '../lib/db';
import { transactions, savings, categories, users, categoryTypeEnum } from '../db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

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

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const limit = Number(c.req.query('limit')) || 100;
    const skip = Number(c.req.query('skip')) || 0;

    const result = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.transactionDate))
        .limit(limit)
        .offset(skip);

    console.log(`[DEBUG] GET /transactions - userId: ${userId}, count: ${result.length}`);

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

    return c.json(formattedResult);
});

app.get('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [transaction] = await db.select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (!transaction) {
        return c.json({ detail: 'Transaction not found' }, 404);
    }
    return c.json(transaction);
});

app.post('/', zValidator('json', transactionSchema, (result, c) => {
    if (!result.success) {
        console.log('Validation Error (POST):', result.error);
        return c.json({ detail: 'Validation failed', error: result.error }, 400);
    }
}), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const body = c.req.valid('json');

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

        // Check if category type is saving
        // Using string comparison because Drizzle enum might be just string
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
        return c.json({ detail: 'Failed to create transaction' }, 500);
    }

    return c.json({
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

app.put('/:id', zValidator('json', transactionSchema, (result, c) => {
    if (!result.success) {
        console.log('Validation Error (PUT):', result.error);
        return c.json({ detail: 'Validation failed', error: result.error }, 400);
    }
}), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');

    const [oldTransaction] = await db.select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (!oldTransaction) {
        return c.json({ detail: 'Transaction not found' }, 404);
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
        return c.json({ detail: 'Failed to update transaction' }, 500);
    }

    return c.json({
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

app.delete('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [transaction] = await db.select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (!transaction) {
        return c.json({ detail: 'Transaction not found' }, 404);
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
    return c.json({
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

app.post('/bulk-delete', zValidator('json', bulkDeleteSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const { ids } = c.req.valid('json');

    const transactionsToDelete = await db.select()
        .from(transactions)
        .where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)));

    if (transactionsToDelete.length === 0) {
        return c.json({ detail: 'No transactions found to delete' }, 404);
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

    return c.newResponse(null, 204);
});

export default app;
