import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../services/auth'
import { UserService } from '../services/users'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { registerSchema, loginSchema, refreshTokenSchema } from '../types/schemas'

export function registerAuthRoutes(prisma: PrismaClient) {
    const router = Router()
    const authService = new AuthService(prisma, new UserService(prisma))

    // POST /api/auth/register
    router.post(
        '/register',
        validateRequest(registerSchema),
        asyncHandler(async (req: Request, res: Response) => {
            const result = await authService.register(req.body)
            res.status(201).json(result)
        })
    )

    // POST /api/auth/login
    router.post(
        '/login',
        validateRequest(loginSchema),
        asyncHandler(async (req: Request, res: Response) => {
            const result = await authService.login(req.body)
            res.json(result)
        })
    )

    // POST /api/auth/refresh
    router.post(
        '/refresh',
        validateRequest(refreshTokenSchema),
        asyncHandler(async (req: Request, res: Response) => {
            const { refreshToken } = req.body
            const result = await authService.refresh(refreshToken)
            res.json(result)
        })
    )

    // POST /api/auth/logout
    router.post(
        '/logout',
        authenticate as any,
        asyncHandler(async (req: Request, res: Response) => {
            await authService.logout(req.user!.id)
            res.json({ message: 'Logged out successfully' })
        })
    )

    // GET /api/auth/me
    router.get(
        '/me',
        authenticate as any,
        asyncHandler(async (req: Request, res: Response) => {
            const user = await new UserService(prisma).findById(req.user!.id)
            res.json(user)
        })
    )

    return router
}
