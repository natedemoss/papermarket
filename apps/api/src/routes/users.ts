import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { UserService } from '../services/users'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { updateUserSchema } from '../types/schemas'

export function registerUserRoutes(prisma: PrismaClient) {
    const router = Router()
    const userService = new UserService(prisma)

    // GET /api/users/leaderboard
    router.get(
        '/leaderboard',
        asyncHandler(async (req: Request, res: Response) => {
            const leaderboard = await userService.getLeaderboard()
            res.json(leaderboard)
        })
    )

    // GET /api/users/:id
    router.get(
        '/:id',
        asyncHandler(async (req: Request, res: Response) => {
            const profile = await userService.getPublicProfile(req.params.id)
            res.json(profile)
        })
    )

    // PATCH /api/users/me
    router.patch(
        '/me',
        authenticate as any,
        validateRequest(updateUserSchema),
        asyncHandler(async (req: Request, res: Response) => {
            const user = await userService.updateProfile(req.user!.id, req.body)
            res.json(user)
        })
    )

    return router
}
