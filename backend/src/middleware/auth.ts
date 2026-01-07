import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ detail: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ detail: 'Not authenticated' });
    }

    try {
        const payload = jwt.verify(token, process.env.SECRET_KEY || 'secret');
        req.user = payload;
        next();
    } catch (e) {
        return res.status(401).json({ detail: 'Invalid token' });
    }
};
