import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { PolymarketSyncService } from '../services/polymarketSync'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, requireAdmin } from '../middleware/auth'

export function registerAdminRoutes(prisma: PrismaClient) {
    const router = Router()

    // POST /api/admin/sync (admin only)
    router.post(
        '/sync',
        authenticate as any,
        requireAdmin as any,
        asyncHandler(async (req: Request, res: Response) => {
            const syncService = new PolymarketSyncService(prisma)
            const result = await syncService.run()
            res.json(result)
        })
    )

    return router
}
