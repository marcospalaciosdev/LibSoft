import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

import { getFirstFieldsErrors } from '../utils/zodErrorParser';

/**
 * Dynamic validation middleware using Zod.
 * @param schema Zod schema to validate the request body
 */
export function validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                const cleanErrors = getFirstFieldsErrors(result.error);

                return res.status(400).json({
                    status: "error",
                    errors: cleanErrors
                });
            }
            req.body = result.data;
            return next();
        } catch (error) {
            console.error("Error crítico en el middleware de validación:", error);
            return res.status(500).json({
                status: "error",
                message: 'Internal Server Error'
            });
        }
    };
}