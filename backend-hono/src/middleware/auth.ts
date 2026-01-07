import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        return c.json({ detail: 'Not authenticated' }, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return c.json({ detail: 'Not authenticated' }, 401);
    }

    try {
        const payload = await verify(token, process.env.SECRET_KEY || 'secret');
        c.set('jwtPayload', payload);
        await next();
    } catch (e) {
        return c.json({ detail: 'Invalid token' }, 401);
    }
});
