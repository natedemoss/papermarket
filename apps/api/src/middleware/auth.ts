import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from './errorHandler'
import { envSchema } from '../types/env'

const env = envSchema.parse(process.env)

export interface AuthRequest extends Request {
    user?: {
        id: string
        username: string
        email: string
        isAdmin: boolean
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Authorization header required')
    }

    const token = authHeader.substring(7)

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; username: string; email: string; isAdmin: boolean }

        req.user = {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            isAdmin: decoded.isAdmin || false,
        }
        next()
    } catch (error) {
        throw new UnauthorizedError('Invalid or expired token')
    }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.isAdmin) {
        throw new UnauthorizedError('Admin access required')
    }
    next()
}
