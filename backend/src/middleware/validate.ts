import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
            const validData = await schema.parseAsync(data);

            // Attach validated data back to request
            if (source === 'body') req.body = validData;
            else if (source === 'query') req.query = validData as any;
            else req.params = validData as any;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    detail: 'Validation Error',
                    errors: (error as any).errors || (error as any).issues
                });
            }
            return res.status(500).json({ detail: 'Internal Server Error' });
        }
    };
};
