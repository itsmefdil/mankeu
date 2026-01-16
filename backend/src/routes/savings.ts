
import { Router } from 'express';
import { db } from '../lib/db';
import { savings, savingTransactions, accounts, transactions, categories } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const savingSchema = z.object({
    name: z.string().min(1),
    amount: z.union([z.string(), z.number()]),
    saving_date: z.string(), // ISO date
});

const depositSchema = z.object({
    amount: z.number().positive(),
    notes: z.string().optional(),
    account_id: z.coerce.number(),
    category_id: z.coerce.number(),
    date: z.string().optional(),
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const limit = Number(req.query.limit) || 100;
    const skip = Number(req.query.skip) || 0;

    const result = await db.select()
        .from(savings)
        .where(eq(savings.userId, userId))
        .limit(limit)
        .offset(skip);

    const formattedResult = result.map(s => ({
        id: s.id,
        user_id: s.userId,
        name: s.name,
        amount: Number(s.amount),
        saving_date: s.savingDate,
        created_at: s.createdAt
    }));

    res.json(formattedResult);
});

router.get('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [saving] = await db.select()
        .from(savings)
        .where(and(eq(savings.id, id), eq(savings.userId, userId)));

    if (!saving) {
        return res.status(404).json({ detail: 'Saving not found' });
    }
    res.json({
        id: saving.id,
        user_id: saving.userId,
        name: saving.name,
        amount: Number(saving.amount),
        saving_date: saving.savingDate,
        created_at: saving.createdAt
    });
});

router.post('/', validate(savingSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    const [newSaving] = await db.insert(savings).values({
        userId,
        name: body.name,
        amount: String(body.amount),
        savingDate: body.saving_date,
    }).returning();

    // Record initial transaction if amount > 0
    // Note: This is treated as "Initial Balance" via no account (or we could force default account?)
    // For now, let's keep it disconnected from accounts as it might be existing savings.
    if (Number(body.amount) > 0) {
        await db.insert(savingTransactions).values({
            savingId: newSaving.id,
            accountId: null, // No account linked for initial setup
            type: 'deposit',
            amount: String(body.amount),
            notes: 'Initial Balance',
            transactionDate: body.saving_date,
        });
    }

    res.json({
        id: newSaving.id,
        user_id: newSaving.userId,
        name: newSaving.name,
        amount: Number(newSaving.amount),
        saving_date: newSaving.savingDate,
        created_at: newSaving.createdAt
    });
});

router.put('/:id', validate(savingSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;

    const [updatedSaving] = await db.update(savings)
        .set({
            name: body.name,
            amount: String(body.amount),
            savingDate: body.saving_date,
        })
        .where(and(eq(savings.id, id), eq(savings.userId, userId)))
        .returning();

    if (!updatedSaving) {
        return res.status(404).json({ detail: 'Saving not found' });
    }
    res.json({
        id: updatedSaving.id,
        user_id: updatedSaving.userId,
        name: updatedSaving.name,
        amount: Number(updatedSaving.amount),
        saving_date: updatedSaving.savingDate,
        created_at: updatedSaving.createdAt
    });
});

router.delete('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    try {
        let deletedSaving: typeof savings.$inferSelect | undefined;

        await db.transaction(async (tx) => {
            // 1. Unlink from regular transactions (preserve the financial record)
            await tx.update(transactions)
                .set({ goalId: null })
                .where(eq(transactions.goalId, id));

            // 2. Delete saving specific transactions (history of this saving)
            await tx.delete(savingTransactions)
                .where(eq(savingTransactions.savingId, id));

            // 3. Delete the saving goal
            [deletedSaving] = await tx.delete(savings)
                .where(and(eq(savings.id, id), eq(savings.userId, userId)))
                .returning();
        });

        if (!deletedSaving) {
            return res.status(404).json({ detail: 'Saving not found' });
        }

        res.json({
            id: deletedSaving.id,
            user_id: deletedSaving.userId,
            name: deletedSaving.name,
            amount: Number(deletedSaving.amount),
            saving_date: deletedSaving.savingDate,
            created_at: deletedSaving.createdAt
        });
    } catch (error) {
        console.error('Error deleting saving:', error);
        res.status(500).json({ detail: 'Failed to delete saving' });
    }
});

router.post('/:id/deposit', validate(depositSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const { amount, notes, account_id, category_id, date } = req.body;
    const txDate = date || new Date().toISOString().split('T')[0];

    // Get current saving
    const [currentSaving] = await db.select()
        .from(savings)
        .where(and(eq(savings.id, id), eq(savings.userId, userId)));

    if (!currentSaving) return res.status(404).json({ detail: 'Saving not found' });

    // Validate Account
    const [account] = await db.select().from(accounts).where(and(eq(accounts.id, account_id), eq(accounts.userId, userId)));
    if (!account) return res.status(400).json({ detail: 'Invalid Account' });

    // Validate Category
    const [category] = await db.select().from(categories).where(and(eq(categories.id, category_id), eq(categories.userId, userId)));
    if (!category) return res.status(400).json({ detail: 'Invalid Category' });

    // Transaction
    let updatedSaving;
    await db.transaction(async (tx) => {
        // 1. Update saving amount
        const newAmount = Number(currentSaving.amount) + amount;
        [updatedSaving] = await tx.update(savings)
            .set({ amount: String(newAmount) })
            .where(eq(savings.id, id))
            .returning();

        // 2. Record Saving Transaction
        await tx.insert(savingTransactions).values({
            savingId: id,
            accountId: account_id,
            type: 'deposit',
            amount: String(amount),
            notes: notes || null,
            transactionDate: txDate,
        });

        // 3. Update Account Balance (Decrease - Expense)
        const newBalance = Number(account.balance) - amount;
        await tx.update(accounts)
            .set({ balance: String(newBalance) })
            .where(eq(accounts.id, account_id));

        // 4. Record Expense Transaction
        // Opsi 1: Saving Deposit is recorded as Expense
        await tx.insert(transactions).values({
            userId,
            accountId: account_id,
            categoryId: category_id,
            name: `Deposit to ${currentSaving.name}`,
            transactionDate: txDate,
            amount: String(amount),
            notes: notes || 'Saving Deposit',
            goalId: id, // Link it for reference
        });
    });

    res.json({
        id: updatedSaving!.id,
        user_id: updatedSaving!.userId,
        name: updatedSaving!.name,
        amount: Number(updatedSaving!.amount),
        saving_date: updatedSaving!.savingDate,
        created_at: updatedSaving!.createdAt
    });
});

router.post('/:id/withdraw', validate(depositSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const { amount, notes, account_id, category_id, date } = req.body;
    const txDate = date || new Date().toISOString().split('T')[0];

    // Get current saving
    const [currentSaving] = await db.select()
        .from(savings)
        .where(and(eq(savings.id, id), eq(savings.userId, userId)));

    if (!currentSaving) return res.status(404).json({ detail: 'Saving not found' });
    if (Number(currentSaving.amount) < amount) return res.status(400).json({ detail: 'Insufficient balance' });

    // Validate Account
    const [account] = await db.select().from(accounts).where(and(eq(accounts.id, account_id), eq(accounts.userId, userId)));
    if (!account) return res.status(400).json({ detail: 'Invalid Account' });

    // Validate Category (Income)
    const [category] = await db.select().from(categories).where(and(eq(categories.id, category_id), eq(categories.userId, userId)));
    if (!category) return res.status(400).json({ detail: 'Invalid Category' });

    let updatedSaving;
    await db.transaction(async (tx) => {
        // 1. Update saving amount
        const newAmount = Number(currentSaving.amount) - amount;
        [updatedSaving] = await tx.update(savings)
            .set({ amount: String(newAmount) })
            .where(eq(savings.id, id))
            .returning();

        // 2. Record Saving Transaction
        await tx.insert(savingTransactions).values({
            savingId: id,
            accountId: account_id,
            type: 'withdraw',
            amount: String(amount),
            notes: notes || null,
            transactionDate: txDate,
        });

        // 3. Update Account Balance (Increase - Income)
        const newBalance = Number(account.balance) + amount;
        await tx.update(accounts)
            .set({ balance: String(newBalance) })
            .where(eq(accounts.id, account_id));

        // 4. Record Income Transaction
        // Withdrawal from Saving = Income to Account
        await tx.insert(transactions).values({
            userId,
            accountId: account_id,
            categoryId: category_id,
            name: `Withdraw from ${currentSaving.name}`,
            transactionDate: txDate,
            amount: String(amount),
            notes: notes || 'Saving Withdrawal',
            goalId: id,
        });
    });

    res.json({
        id: updatedSaving!.id,
        user_id: updatedSaving!.userId,
        name: updatedSaving!.name,
        amount: Number(updatedSaving!.amount),
        saving_date: updatedSaving!.savingDate,
        created_at: updatedSaving!.createdAt
    });
});

router.get('/:id/transactions', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    // Verify saving belongs to user
    const [saving] = await db.select()
        .from(savings)
        .where(and(eq(savings.id, id), eq(savings.userId, userId)));

    if (!saving) {
        return res.status(404).json({ detail: 'Saving not found' });
    }

    // Get transactions with Account info
    const transactionsList = await db.select({
        id: savingTransactions.id,
        savingId: savingTransactions.savingId,
        accountId: savingTransactions.accountId,
        type: savingTransactions.type,
        amount: savingTransactions.amount,
        notes: savingTransactions.notes,
        transactionDate: savingTransactions.transactionDate,
        createdAt: savingTransactions.createdAt,
        accountName: accounts.name
    })
        .from(savingTransactions)
        .leftJoin(accounts, eq(savingTransactions.accountId, accounts.id))
        .where(eq(savingTransactions.savingId, id))
        .orderBy(desc(savingTransactions.createdAt));

    const formattedTransactions = transactionsList.map(t => ({
        id: t.id,
        saving_id: t.savingId,
        account_id: t.accountId,
        account_name: t.accountName,
        type: t.type,
        amount: Number(t.amount),
        notes: t.notes,
        transaction_date: t.transactionDate,
        created_at: t.createdAt
    }));

    res.json(formattedTransactions);
});

export default router;
