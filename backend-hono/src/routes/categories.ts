import { Hono } from 'hono';
import { db } from '../lib/db';
import { categories, categoryTypeEnum } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

const categorySchema = z.object({
    name: z.string().min(1),
    type: z.enum(['expense', 'income', 'saving']),
});

// Protect all routes
app.use('*', authMiddleware);

app.get('/', async (c) => {
    const allCategories = await db.select().from(categories);
    return c.json(allCategories);
});

app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const [category] = await db.select().from(categories).where(eq(categories.id, id));

    if (!category) {
        return c.json({ detail: 'Category not found' }, 404);
    }
    return c.json(category);
});

app.post('/', zValidator('json', categorySchema), async (c) => {
    const body = c.req.valid('json');
    const [newCategory] = await db.insert(categories).values(body).returning();
    return c.json(newCategory);
});

app.put('/:id', zValidator('json', categorySchema), async (c) => {
    const id = Number(c.req.param('id'));
    const body = c.req.valid('json');

    const [updatedCategory] = await db.update(categories)
        .set(body)
        .where(eq(categories.id, id))
        .returning();

    if (!updatedCategory) {
        return c.json({ detail: 'Category not found' }, 404);
    }
    return c.json(updatedCategory);
});

app.delete('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    const [deletedCategory] = await db.delete(categories)
        .where(eq(categories.id, id))
        .returning();

    if (!deletedCategory) {
        return c.json({ detail: 'Category not found' }, 404);
    }
    return c.json(deletedCategory);
});

export default app;
