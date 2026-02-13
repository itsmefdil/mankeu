
import { Router } from 'express';
import { db } from '../lib/db';
import { transfers, accounts, transactions, categories } from '../db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { alias } from 'drizzle-orm/pg-core';

const router = Router();

const transferSchema = z.object({
    from_account_id: z.coerce.number(),
    to_account_id: z.coerce.number(),
    amount: z.union([z.string(), z.number()]),
    date: z.string(), // ISO date
    notes: z.string().optional().nullable(),
});

router.use(authMiddleware);

// GET All Transfers
router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;

    const fromAccounts = alias(accounts, 'fromAccount');
    const toAccounts = alias(accounts, 'toAccount');

    const result = await db.select({
        id: transfers.id,
        userId: transfers.userId,
        fromAccountId: transfers.fromAccountId,
        toAccountId: transfers.toAccountId,
        amount: transfers.amount,
        notes: transfers.notes,
        date: transfers.date,
        createdAt: transfers.createdAt,
        fromAccountName: fromAccounts.name,
        toAccountName: toAccounts.name
    })
        .from(transfers)
        .leftJoin(fromAccounts, eq(transfers.fromAccountId, fromAccounts.id))
        .leftJoin(toAccounts, eq(transfers.toAccountId, toAccounts.id))
        .where(eq(transfers.userId, userId))
        .orderBy(desc(transfers.date), desc(transfers.createdAt))
        .limit(limit)
        .offset(skip);

    const formatted = result.map(t => ({
        id: t.id,
        user_id: t.userId,
        from_account_id: t.fromAccountId,
        to_account_id: t.toAccountId,
        amount: Number(t.amount),
        notes: t.notes,
        date: t.date,
        created_at: t.createdAt,
        from_account_name: t.fromAccountName,
        to_account_name: t.toAccountName
    }));

    res.json(formatted);
});

// POST Create Transfer
router.post('/', validate(transferSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    if (body.from_account_id === body.to_account_id) {
        return res.status(400).json({ detail: 'Cannot transfer to the same account' });
    }

    const amount = Number(body.amount);
    if (amount <= 0) {
        return res.status(400).json({ detail: 'Amount must be positive' });
    }

    // Verify ownership and existence
    const userAccounts = await db.select().from(accounts)
        .where(and(
            eq(accounts.userId, userId),
            or(eq(accounts.id, body.from_account_id), eq(accounts.id, body.to_account_id))
        ));

    const fromAccount = userAccounts.find(a => a.id === body.from_account_id);
    const toAccount = userAccounts.find(a => a.id === body.to_account_id);

    if (!fromAccount || !toAccount) {
        return res.status(400).json({ detail: 'One or both accounts are invalid' });
    }

    // Helper to get or create transfer category
    const getTransferCategory = async (type: 'expense' | 'income', name: string) => {
        const [existing] = await db.select().from(categories)
            .where(and(
                eq(categories.userId, userId),
                eq(categories.name, name),
                eq(categories.type, type)
            ));

        if (existing) return existing;

        const [created] = await db.insert(categories).values({
            userId,
            name,
            type,
        }).returning();
        return created;
    };

    // (Duplicate block removed)

    // Move category fetching OUTSIDE transaction to avoid complex nesting/locking if multiple requests
    const transferOutCat = await getTransferCategory('expense', 'Transfer Keluar');
    const transferInCat = await getTransferCategory('income', 'Transfer Masuk');

    await db.transaction(async (tx) => {
        // 1. Insert Transfer Record
        const [newTransfer] = await tx.insert(transfers).values({
            userId,
            fromAccountId: body.from_account_id,
            toAccountId: body.to_account_id,
            amount: String(amount),
            date: body.date,
            notes: body.notes,
        }).returning();

        // 2. Debit From Account
        await tx.update(accounts)
            .set({ balance: String(Number(fromAccount.balance) - amount) })
            .where(eq(accounts.id, fromAccount.id));

        // 3. Credit To Account
        await tx.update(accounts)
            .set({ balance: String(Number(toAccount.balance) + amount) })
            .where(eq(accounts.id, toAccount.id));

        // 4. Create Transactions in History (linked via logic, though not foreign key yet)
        // 4a. Expense (Source)
        await tx.insert(transactions).values({
            userId,
            accountId: body.from_account_id,
            categoryId: transferOutCat.id,
            name: `Transfer ke ${toAccount.name}`,
            transactionDate: body.date,
            amount: String(amount),
            notes: body.notes || 'Transfer Out',
            isTransfer: true,
            // goalId: null, // No goal linked
        });

        // 4b. Income (Destination)
        await tx.insert(transactions).values({
            userId,
            accountId: body.to_account_id,
            categoryId: transferInCat.id,
            name: `Transfer dari ${fromAccount.name}`,
            transactionDate: body.date,
            amount: String(amount),
            notes: body.notes || 'Transfer In',
            isTransfer: true,
        });
    });

    res.json({ success: true });
});

export default router;
