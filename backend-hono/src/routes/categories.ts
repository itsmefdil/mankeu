import { Router } from 'express';
import { db } from '../lib/db';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';
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
    const allCategories = await db.select().from(categories);
    res.json(allCategories);
});

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const [category] = await db.select().from(categories).where(eq(categories.id, id));

    if (!category) {
        return res.status(404).json({ detail: 'Category not found' });
    }
    res.json(category);
});

router.post('/', validate(categorySchema), async (req, res) => {
    const body = req.body;
    const [newCategory] = await db.insert(categories).values(body).returning();
    res.json(newCategory);
});

router.put('/:id', validate(categorySchema), async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body;

    const [updatedCategory] = await db.update(categories)
        .set(body)
        .where(eq(categories.id, id))
        .returning();

    if (!updatedCategory) {
        return res.status(404).json({ detail: 'Category not found' });
    }
    res.json(updatedCategory);
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const [deletedCategory] = await db.delete(categories)
        .where(eq(categories.id, id))
        .returning();

    if (!deletedCategory) {
        return res.status(404).json({ detail: 'Category not found' });
    }
    res.json(deletedCategory);
});

export default router;
