import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

const googleLoginSchema = z.object({
    id_token: z.string(),
});

// Helper to create token
const createAccessToken = (userId: number) => {
    // 6 months expiration in seconds
    const expiresIn = 60 * 60 * 24 * 30 * 6;
    return jwt.sign({ sub: String(userId) }, process.env.SECRET_KEY || 'secret', { expiresIn });
};

router.post('/login', validate(loginSchema), async (req, res) => {
    const { username, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, username));

    if (!user) {
        return res.status(400).json({ detail: 'Incorrect email or password' });
    }

    const isValid = await compare(password, user.hashedPassword);
    if (!isValid) {
        return res.status(400).json({ detail: 'Incorrect email or password' });
    }

    const token = createAccessToken(user.id);
    res.json({
        access_token: token,
        token_type: 'bearer',
    });
});

router.post('/login/google', validate(googleLoginSchema), async (req, res) => {
    const { id_token } = req.body;

    // Verify Google Token
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);

    if (!googleRes.ok) {
        const errText = await googleRes.text();
        console.error('Google Token Error:', errText);
        return res.status(400).json({ detail: 'Invalid Google Token' });
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
        return res.status(400).json({ detail: 'Invalid Google Token: No email found' });
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
            hashedPassword: await hash(randomPassword, 10),
            picture: payload.picture,
            givenName: payload.given_name,
            familyName: payload.family_name,
            locale: payload.locale,
        }).returning();

        if (!newUser) {
            return res.status(500).json({ detail: 'Failed to create user' });
        }
        userId = newUser.id;
    }

    const token = createAccessToken(userId);
    res.json({
        access_token: token,
        token_type: 'bearer',
    });
});

export default router;
