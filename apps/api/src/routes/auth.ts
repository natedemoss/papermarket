import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { AuthService } from '../services/auth'
import { UserService } from '../services/users'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { registerSchema, loginSchema, refreshTokenSchema } from '../types/schemas'
import { getGoogleAuthUrl, handleGoogleCallback } from '../services/googleAuth'

export function registerAuthRoutes(prisma: PrismaClient) {
    const router = Router()
    const authService = new AuthService(prisma, new UserService(prisma))

    const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    const GOOGLE_CALLBACK_URL = (process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:8080/api/auth/google/callback').trim()

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
            if (!user) { res.status(404).json({ error: 'User not found' }); return }
            res.json({ ...user, paperBalance: Number(user.paperBalance) })
        })
    )

    // GET /api/auth/google — redirect to Google
    router.get('/google', (req: Request, res: Response) => {
        if (!googleEnabled) {
            res.status(503).json({ error: 'Google OAuth not configured' })
            return
        }
        res.redirect(getGoogleAuthUrl(GOOGLE_CALLBACK_URL))
    })

    // GET /api/auth/google/callback — Google redirects here
    router.get('/google/callback', asyncHandler(async (req: Request, res: Response) => {
        const { code, error } = req.query as { code?: string; error?: string }

        if (error || !code) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)
        }

        const user = await handleGoogleCallback(code, GOOGLE_CALLBACK_URL, prisma)

        const accessToken = jwt.sign(
            { userId: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin },
            process.env.JWT_SECRET!,
            { expiresIn: '15m' }
        )
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '7d' }
        )

        await authService.storeRefreshTokenForUser(user.id, refreshToken)

        const params = new URLSearchParams({ accessToken, refreshToken })
        res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?${params.toString()}`)
    }))

    // GET /api/auth/google/status
    router.get('/google/status', (req: Request, res: Response) => {
        res.json({ enabled: googleEnabled })
    })

    return router
}
