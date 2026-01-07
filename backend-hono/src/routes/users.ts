import { Router } from 'express';
import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authMiddleware);

router.get('/me', async (req, res) => {
    const userId = Number(req.user.sub);

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
        return res.status(404).json({ detail: 'User not found' });
    }

    // Remove password from response
    const { hashedPassword, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

const userUpdateSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    currency: z.string().optional(),
});

router.put('/me', validate(userUpdateSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.currency !== undefined) updateData.currency = body.currency;

    if (Object.keys(updateData).length === 0) {
        // No fields to update, return current user
        const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!currentUser) {
            return res.status(404).json({ detail: 'User not found' });
        }
        const { hashedPassword, ...userWithoutPassword } = currentUser;
        return res.json(userWithoutPassword);
    }

    const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

    if (!updatedUser) {
        return res.status(404).json({ detail: 'User not found' });
    }

    const { hashedPassword, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
});

export default router;
