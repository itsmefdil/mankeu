
import { Router } from 'express';
import { db } from '../lib/db';
import { accounts } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Schema
const accountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['cash', 'bank', 'ewallet']).default('cash'),
    balance: z.union([z.string(), z.number()]).optional(), // Allow setting initial balance
    is_default: z.boolean().optional().default(false),
});

router.use(authMiddleware);

// GET All Accounts
router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const userAccounts = await db.select().from(accounts)
        .where(eq(accounts.userId, userId))
        .orderBy(desc(accounts.isDefault), accounts.name);

    // Map to snake_case if needed or keep mixed? 
    // Frontend usually expects snake_case from python backend conventions described in earlier context?
    // But previous endpoints returned mixed. Let's look at `transactions.ts`.
    // It returns snake_case for properties.

    const formatted = userAccounts.map(a => ({
        id: a.id,
        user_id: a.userId,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        is_default: a.isDefault,
        created_at: a.createdAt
    }));

    res.json(formatted);
});

// GET One
router.get('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [account] = await db.select().from(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

    if (!account) return res.status(404).json({ detail: 'Account not found' });

    res.json({
        id: account.id,
        user_id: account.userId,
        name: account.name,
        type: account.type,
        balance: Number(account.balance),
        is_default: account.isDefault,
        created_at: account.createdAt
    });
});

// POST Create
router.post('/', validate(accountSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    // Logic: If setting as default, unset others?
    if (body.is_default) {
        await db.update(accounts)
            .set({ isDefault: false })
            .where(eq(accounts.userId, userId));
    }

    const [newAccount] = await db.insert(accounts).values({
        userId,
        name: body.name,
        type: body.type as any,
        balance: body.balance ? String(body.balance) : '0',
        isDefault: body.is_default,
    }).returning();

    res.json({
        id: newAccount.id,
        user_id: newAccount.userId,
        name: newAccount.name,
        type: newAccount.type,
        balance: Number(newAccount.balance),
        is_default: newAccount.isDefault,
        created_at: newAccount.createdAt
    });
});

// PUT Update
router.put('/:id', validate(accountSchema.partial()), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;

    const [account] = await db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    if (!account) return res.status(404).json({ detail: 'Account not found' });

    if (body.is_default) {
        await db.update(accounts)
            .set({ isDefault: false })
            .where(eq(accounts.userId, userId));
    }

    const [updated] = await db.update(accounts)
        .set({
            name: body.name,
            type: body.type as any,
            // Allow updating balance? Maybe for correction.
            balance: body.balance !== undefined ? String(body.balance) : undefined,
            isDefault: body.is_default,
        })
        .where(eq(accounts.id, id))
        .returning();

    res.json({
        id: updated.id,
        user_id: updated.userId,
        name: updated.name,
        type: updated.type,
        balance: Number(updated.balance),
        is_default: updated.isDefault,
        created_at: updated.createdAt
    });
});

// DELETE
router.delete('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [account] = await db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    if (!account) return res.status(404).json({ detail: 'Account not found' });

    // Check if default
    if (account.isDefault) {
        return res.status(400).json({ detail: 'Cannot delete default account' });
    }

    try {
        await db.delete(accounts).where(eq(accounts.id, id));
        res.json({ id: account.id, name: account.name });
    } catch (error) {
        // Likely FK constraint
        res.status(400).json({ detail: 'Cannot delete account with existing transactions' });
    }
});

export default router;
