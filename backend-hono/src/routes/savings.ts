import { Router } from 'express';
import { db } from '../lib/db';
import { savings } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const savingSchema = z.object({
    name: z.string().min(1),
    amount: z.number(),
    saving_date: z.string(), // ISO date
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

    const [deletedSaving] = await db.delete(savings)
        .where(and(eq(savings.id, id), eq(savings.userId, userId)))
        .returning();

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
});

export default router;
