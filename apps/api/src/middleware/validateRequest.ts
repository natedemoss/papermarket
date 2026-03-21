import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { BadRequestError } from './errorHandler'

export const validateRequest = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse({
                ...req.body,
                ...req.query,
            })
            req.body = parsed
            next()
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                }))
                throw new BadRequestError(JSON.stringify(errors))
            }
            next(error)
        }
    }
}
