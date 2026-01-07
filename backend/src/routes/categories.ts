import { Router } from 'express';
import { db } from '../lib/db';
import { categories } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const categorySchema = z.object({
    name: z.string().min(1),
    type: z.enum(['expense', 'income', 'saving']),
});

// Protect all routes
router.use(authMiddleware);

router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const { month, year } = req.query;

    let whereClause = eq(categories.userId, userId);

    if (month && year) {
        whereClause = and(
            whereClause,
            sql`EXTRACT(MONTH FROM ${categories.createdAt}) = ${month}`,
            sql`EXTRACT(YEAR FROM ${categories.createdAt}) = ${year}`
        ) as any;
    }

    const allCategories = await db.select().from(categories).where(whereClause);
    res.json(allCategories);
});

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.user.sub);
    const [category] = await db.select().from(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));

    if (!category) {
        return res.status(404).json({ detail: 'Category not found' });
    }
    res.json(category);
});

router.post('/', validate(categorySchema), async (req, res) => {
    const body = req.body;
    const userId = Number(req.user.sub);

    const [newCategory] = await db.insert(categories)
        .values({ ...body, userId })
        .returning();
    res.json(newCategory);
});

router.put('/:id', validate(categorySchema), async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.user.sub);
    const body = req.body;

    const [updatedCategory] = await db.update(categories)
        .set(body)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();

    if (!updatedCategory) {
        return res.status(404).json({ detail: 'Category not found' });
    }
    res.json(updatedCategory);
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.user.sub);
    const [deletedCategory] = await db.delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();

    if (!deletedCategory) {
        return res.status(404).json({ detail: 'Category not found' });
    }
    res.json(deletedCategory);
});

export default router;
