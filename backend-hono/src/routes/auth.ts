import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

const loginSchema = z.object({
    username: z.string(), // OAuth2PasswordRequestForm uses username for email
    password: z.string(),
});

const googleLoginSchema = z.object({
    id_token: z.string(),
});

// Helper to create token
const createAccessToken = async (userId: number) => {
    // 6 months expiration
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 6;
    return await sign({ sub: String(userId), exp }, process.env.SECRET_KEY || 'secret');
};

app.post('/login', zValidator('form', loginSchema), async (c) => {
    const { username, password } = c.req.valid('form');

    const [user] = await db.select().from(users).where(eq(users.email, username));

    if (!user) {
        console.error('Login Failed: User not found for email', username);
        return c.json({ detail: 'Incorrect email or password' }, 400);
    }

    const isValid = await Bun.password.verify(password, user.hashedPassword);
    if (!isValid) {
        console.error('Login Failed: Invalid password for user', username);
        // Fallback check for Python-generated bcrypt hashes (just in case Bun needs help, though it should handle it)
        // bcrypt hashes start with $2b$ or $2a$. Bun supports them.
        return c.json({ detail: 'Incorrect email or password' }, 400);
    }

    const token = await createAccessToken(user.id);
    return c.json({
        access_token: token,
        token_type: 'bearer',
    });
});

app.post('/login/google', zValidator('json', googleLoginSchema), async (c) => {
    const { id_token } = c.req.valid('json');

    // Verify Google Token
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);

    if (!googleRes.ok) {
        const errText = await googleRes.text();
        console.error('Google Token Error:', errText);
        return c.json({ detail: 'Invalid Google Token' }, 400);
    }

    const payload = await googleRes.json() as {
        email?: string;
        name?: string;
        picture?: string;
        given_name?: string;
        family_name?: string;
        locale?: string;
    };
    const email = payload.email;

    if (!email) {
        return c.json({ detail: 'Invalid Google Token: No email found' }, 400);
    }

    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    let userId: number;

    if (existingUser) {
        // Update user
        await db.update(users).set({
            name: payload.name,
            picture: payload.picture,
            givenName: payload.given_name,
            familyName: payload.family_name,
            locale: payload.locale,
        }).where(eq(users.id, existingUser.id));
        userId = existingUser.id;
    } else {
        // Create user
        const randomPassword = Math.random().toString(36).slice(-8);
        const [newUser] = await db.insert(users).values({
            email: email,
            name: payload.name || email.split('@')[0],
            hashedPassword: await Bun.password.hash(randomPassword),
            picture: payload.picture,
            givenName: payload.given_name,
            familyName: payload.family_name,
            locale: payload.locale,
        }).returning();

        if (!newUser) {
            return c.json({ detail: 'Failed to create user' }, 500);
        }
        userId = newUser.id;
    }

    const token = await createAccessToken(userId);
    return c.json({
        access_token: token,
        token_type: 'bearer',
    });
});

export default app;
