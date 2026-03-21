import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
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

    // PATCH /api/users/me/password
    router.patch(
        '/me/password',
        authenticate as any,
        asyncHandler(async (req: Request, res: Response) => {
            const { currentPassword, newPassword } = req.body
            if (!currentPassword || !newPassword) {
                res.status(400).json({ error: 'currentPassword and newPassword are required' }); return
            }
            const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
            if (!user?.passwordHash) {
                res.status(400).json({ error: 'No password set on this account' }); return
            }
            const valid = await bcrypt.compare(currentPassword, user.passwordHash)
            if (!valid) {
                res.status(401).json({ error: 'Current password is incorrect' }); return
            }
            const hash = await bcrypt.hash(newPassword, 10)
            await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } })
            res.json({ success: true })
        })
    )

    return router
}
