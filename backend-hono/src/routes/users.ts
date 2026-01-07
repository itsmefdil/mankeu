import { Hono } from 'hono';
import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/me', async (c) => {
    const userPayload = c.get('jwtPayload');
    const userId = Number(userPayload.sub);

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
        return c.json({ detail: 'User not found' }, 404);
    }

    // Remove password from response
    const { hashedPassword, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
});

const userUpdateSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    currency: z.string().optional(),
});

app.put('/me', zValidator('json', userUpdateSchema), async (c) => {
    const userPayload = c.get('jwtPayload');
    const userId = Number(userPayload.sub);
    const body = c.req.valid('json');

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.currency !== undefined) updateData.currency = body.currency;

    if (Object.keys(updateData).length === 0) {
        // No fields to update, return current user
        const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
        if (!currentUser) {
            return c.json({ detail: 'User not found' }, 404);
        }
        const { hashedPassword, ...userWithoutPassword } = currentUser;
        return c.json(userWithoutPassword);
    }

    const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

    if (!updatedUser) {
        return c.json({ detail: 'User not found' }, 404);
    }

    const { hashedPassword, ...userWithoutPassword } = updatedUser;
    return c.json(userWithoutPassword);
});

export default app;
