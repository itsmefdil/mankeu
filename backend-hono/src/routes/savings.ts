import { Hono } from 'hono';
import { db } from '../lib/db';
import { savings } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

const savingSchema = z.object({
    name: z.string().min(1),
    amount: z.number(),
    saving_date: z.string(), // ISO date
});

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const limit = Number(c.req.query('limit')) || 100;
    const skip = Number(c.req.query('skip')) || 0;

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

    return c.json(formattedResult);
});

app.get('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [saving] = await db.select()
        .from(savings)
        .where(and(eq(savings.id, id), eq(savings.userId, userId)));

    if (!saving) {
        return c.json({ detail: 'Saving not found' }, 404);
    }
    return c.json({
        id: saving.id,
        user_id: saving.userId,
        name: saving.name,
        amount: Number(saving.amount),
        saving_date: saving.savingDate,
        created_at: saving.createdAt
    });
});

app.post('/', zValidator('json', savingSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const body = c.req.valid('json');

    const [newSaving] = await db.insert(savings).values({
        userId,
        name: body.name,
        amount: String(body.amount),
        savingDate: body.saving_date,
    }).returning();

    return c.json({
        id: newSaving.id,
        user_id: newSaving.userId,
        name: newSaving.name,
        amount: Number(newSaving.amount),
        saving_date: newSaving.savingDate,
        created_at: newSaving.createdAt
    });
});

app.put('/:id', zValidator('json', savingSchema), async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');

    const [updatedSaving] = await db.update(savings)
        .set({
            name: body.name,
            amount: String(body.amount),
            savingDate: body.saving_date,
        })
        .where(and(eq(savings.id, id), eq(savings.userId, userId)))
        .returning();

    if (!updatedSaving) {
        return c.json({ detail: 'Saving not found' }, 404);
    }
    return c.json({
        id: updatedSaving.id,
        user_id: updatedSaving.userId,
        name: updatedSaving.name,
        amount: Number(updatedSaving.amount),
        saving_date: updatedSaving.savingDate,
        created_at: updatedSaving.createdAt
    });
});

app.delete('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const userId = Number(user.sub);
    const id = Number(c.req.param('id'));

    const [deletedSaving] = await db.delete(savings)
        .where(and(eq(savings.id, id), eq(savings.userId, userId)))
        .returning();

    if (!deletedSaving) {
        return c.json({ detail: 'Saving not found' }, 404);
    }
    return c.json({
        id: deletedSaving.id,
        user_id: deletedSaving.userId,
        name: deletedSaving.name,
        amount: Number(deletedSaving.amount),
        saving_date: deletedSaving.savingDate,
        created_at: deletedSaving.createdAt
    });
});

export default app;
