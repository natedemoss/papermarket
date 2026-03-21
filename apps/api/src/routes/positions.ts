import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { PositionService } from '../services/positions'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'

export function registerPositionRoutes(prisma: PrismaClient) {
    const router = Router()
    const positionService = new PositionService(prisma)

    // GET /api/positions/me
    router.get(
        '/me',
        authenticate as any,
        asyncHandler(async (req: Request, res: Response) => {
            const positions = await positionService.getUserPositions(req.user!.id)
            res.json(positions)
        })
    )

    return router
}
