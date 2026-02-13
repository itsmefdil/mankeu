import { Router } from 'express';
import { db } from '../lib/db';
import { transactions, savings, categories, accounts } from '../db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const transactionSchema = z.object({
    category_id: z.coerce.number(),
    account_id: z.coerce.number(),
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

    const result = await db.select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        categoryId: transactions.categoryId,
        name: transactions.name,
        transactionDate: transactions.transactionDate,
        amount: transactions.amount,
        notes: transactions.notes,
        goalId: transactions.goalId,
        createdAt: transactions.createdAt,
        accountName: accounts.name,
        categoryName: categories.name,
        categoryType: categories.type,
        isTransfer: transactions.isTransfer
    })
        .from(transactions)
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
        .limit(limit)
        .offset(skip);

    const formattedResult = result.map(t => ({
        id: t.id,
        user_id: t.userId,
        account_id: t.accountId,
        category_id: t.categoryId,
        name: t.name,
        transaction_date: t.transactionDate,
        amount: Number(t.amount),
        notes: t.notes,
        goal_id: t.goalId,
        created_at: t.createdAt,
        account_name: t.accountName,
        category_name: t.categoryName,
        type: t.categoryType,
        is_transfer: t.isTransfer
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

    // Get Category Type to determine Balance impact
    const [category] = await db.select().from(categories).where(eq(categories.id, body.category_id));
    if (!category) {
        return res.status(400).json({ detail: 'Invalid Category' });
    }

    // Get Account
    const [account] = await db.select().from(accounts).where(and(eq(accounts.id, body.account_id), eq(accounts.userId, userId)));
    if (!account) {
        return res.status(400).json({ detail: 'Invalid Account' });
    }

    // Create transaction
    const [newTransaction] = await db.insert(transactions).values({
        userId,
        accountId: body.account_id,
        categoryId: body.category_id,
        name: body.name,
        transactionDate: body.transaction_date,
        amount: String(body.amount),
        notes: body.notes,
        goalId: body.goal_id,
    }).returning();

    // Update Account Balance
    // Income: + Amount, Expense: - Amount
    let balanceChange = 0;
    if (category.type === 'income') {
        balanceChange = Number(body.amount);
    } else {
        balanceChange = -Number(body.amount);
    }

    // Check for Saving Category (Special case "Opsi 1" - handled by frontend/logic?)
    // If category is saving, it is treated as Expense (balance decreases). Logic holds.

    const newBalance = Number(account.balance) + balanceChange;
    await db.update(accounts)
        .set({ balance: String(newBalance) })
        .where(eq(accounts.id, account.id));

    res.json({
        id: newTransaction.id,
        user_id: newTransaction.userId,
        account_id: newTransaction.accountId,
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

    // Get Old Transaction
    const oldTransactionResult = await db.select({
        tx: transactions,
        cat: categories
    })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (!oldTransactionResult.length) {
        return res.status(404).json({ detail: 'Transaction not found' });
    }
    const { tx: oldTransaction, cat: oldCategory } = oldTransactionResult[0];

    // Get New Category
    const [newCategory] = await db.select().from(categories).where(eq(categories.id, body.category_id));
    if (!newCategory) {
        return res.status(400).json({ detail: 'Invalid New Category' });
    }

    // Update Transaction
    const [updatedTransaction] = await db.update(transactions)
        .set({
            accountId: body.account_id,
            categoryId: body.category_id,
            name: body.name,
            transactionDate: body.transaction_date,
            amount: String(body.amount),
            notes: body.notes,
            goalId: body.goal_id,
        })
        .where(eq(transactions.id, id))
        .returning();

    // Revert Old Balance Impact
    if (oldCategory && oldTransaction.accountId) {
        const [oldAccount] = await db.select().from(accounts).where(eq(accounts.id, oldTransaction.accountId));
        if (oldAccount) {
            let revertChange = 0;
            if (oldCategory.type === 'income') {
                revertChange = -Number(oldTransaction.amount); // Was +, so -, to revert
            } else {
                revertChange = Number(oldTransaction.amount); // Was -, so +, to revert
            }
            await db.update(accounts)
                .set({ balance: String(Number(oldAccount.balance) + revertChange) })
                .where(eq(accounts.id, oldAccount.id));
        }
    }

    // Apply New Balance Impact
    const [newAccount] = await db.select().from(accounts).where(eq(accounts.id, body.account_id));
    if (newAccount) {
        let applyChange = 0;
        if (newCategory.type === 'income') {
            applyChange = Number(body.amount);
        } else {
            applyChange = -Number(body.amount);
        }
        await db.update(accounts)
            .set({ balance: String(Number(newAccount.balance) + applyChange) })
            .where(eq(accounts.id, newAccount.id));
    }

    res.json({
        id: updatedTransaction.id,
        user_id: updatedTransaction.userId,
        account_id: updatedTransaction.accountId,
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

    const transactionResult = await db.select({
        tx: transactions,
        cat: categories
    })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

    if (!transactionResult.length) {
        return res.status(404).json({ detail: 'Transaction not found' });
    }
    const { tx: transaction, cat: category } = transactionResult[0];

    // Delete transaction
    await db.delete(transactions).where(eq(transactions.id, id));

    // Revert Balance
    if (category && transaction.accountId) {
        const [account] = await db.select().from(accounts).where(eq(accounts.id, transaction.accountId));
        if (account) {
            let revertChange = 0;
            if (category.type === 'income') {
                revertChange = -Number(transaction.amount);
            } else {
                revertChange = Number(transaction.amount);
            }
            await db.update(accounts)
                .set({ balance: String(Number(account.balance) + revertChange) })
                .where(eq(accounts.id, account.id));
        }
    }

    res.json({
        id: transaction.id,
        user_id: transaction.userId,
        // ... return other fields if needed
    });
});

router.post('/bulk-delete', validate(bulkDeleteSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const { ids } = req.body;

    const transactionsToDelete = await db.select({
        tx: transactions,
        cat: categories
    })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(inArray(transactions.id, ids), eq(transactions.userId, userId)));

    if (transactionsToDelete.length === 0) {
        return res.status(404).json({ detail: 'No transactions found to delete' });
    }

    for (const { tx: transaction, cat: category } of transactionsToDelete) {
        // Delete
        await db.delete(transactions).where(eq(transactions.id, transaction.id));

        // Revert Balance
        if (category && transaction.accountId) {
            const [account] = await db.select().from(accounts).where(eq(accounts.id, transaction.accountId));
            if (account) {
                let revertChange = 0;
                if (category.type === 'income') {
                    revertChange = -Number(transaction.amount);
                } else {
                    revertChange = Number(transaction.amount);
                }
                await db.update(accounts)
                    .set({ balance: String(Number(account.balance) + revertChange) })
                    .where(eq(accounts.id, account.id));
            }
        }
    }

    res.status(204).send();
});

export default router;
