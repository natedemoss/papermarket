import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { MarketService } from '../services/markets'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { createMarketSchema, resolveMarketSchema } from '../types/schemas'

export function registerMarketRoutes(prisma: PrismaClient) {
    const router = Router()
    const marketService = new MarketService(prisma)

    // GET /api/markets
    router.get(
        '/',
        asyncHandler(async (req: Request, res: Response) => {
            const { category, sort } = req.query as any
            const markets = await marketService.getAll({ category, sort })
            res.json(markets)
        })
    )

    // GET /api/markets/:id
    router.get(
        '/:id',
        asyncHandler(async (req: Request, res: Response) => {
            const market = await marketService.getById(req.params.id)
            res.json(market)
        })
    )

    // POST /api/markets (admin only)
    router.post(
        '/',
        authenticate as any,
        requireAdmin as any,
        validateRequest(createMarketSchema),
        asyncHandler(async (req: Request, res: Response) => {
            const market = await marketService.create(req.body, req.user!.id)
            res.status(201).json(market)
        })
    )

    // POST /api/markets/:id/resolve (admin only)
    router.post(
        '/:id/resolve',
        authenticate as any,
        requireAdmin as any,
        validateRequest(resolveMarketSchema),
        asyncHandler(async (req: Request, res: Response) => {
            const market = await marketService.resolve(req.params.id, req.body.outcome, req.user!.id)
            res.json(market)
        })
    )

    return router
}
