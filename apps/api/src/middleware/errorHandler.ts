import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
    status?: number
    isOperational?: boolean
}

export const createErrorHandlingMiddleware = () => {
    return (err: AppError, req: Request, res: Response, next: NextFunction) => {
        const statusCode = err.status || 500

        console.error(`[${statusCode}] ${err.message}`, {
            path: req.path,
            method: req.method,
            stack: err.stack,
        })

        res.status(statusCode).json({
            error: err.message || 'Internal server error',
            status: statusCode,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        })
    }
}

// Async wrapper to catch unhandled promise rejections
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

// Custom error classes
export class BadRequestError extends Error implements AppError {
    status = 400
    isOperational = true

    constructor(message: string) {
        super(message)
        this.name = 'BadRequestError'
    }
}

export class UnauthorizedError extends Error implements AppError {
    status = 401
    isOperational = true

    constructor(message: string) {
        super(message)
        this.name = 'UnauthorizedError'
    }
}

export class ForbiddenError extends Error implements AppError {
    status = 403
    isOperational = true

    constructor(message: string) {
        super(message)
        this.name = 'ForbiddenError'
    }
}

export class NotFoundError extends Error implements AppError {
    status = 404
    isOperational = true

    constructor(message: string) {
        super(message)
        this.name = 'NotFoundError'
    }
}

export class ValidationError extends Error implements AppError {
    status = 422
    isOperational = true

    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}
