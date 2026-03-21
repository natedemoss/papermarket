import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { TradeService } from '../services/trades'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { placeTradeSchema } from '../types/schemas'

export function registerTradeRoutes(prisma: PrismaClient) {
    const router = Router()
    const tradeService = new TradeService(prisma)

    // POST /api/trades
    router.post(
        '/',
        authenticate as any,
        validateRequest(placeTradeSchema),
        asyncHandler(async (req: Request, res: Response) => {
            try {
                const result = await tradeService.place(req.user!.id, req.body)
                res.status(201).json(result)
            } catch (err: any) {
                if (err.code === 'P2000' || err.message?.includes('numeric field overflow') || err.message?.includes('ConnectorError')) {
                    res.status(400).json({ error: 'Trade amount is too large for this market. Please try a smaller amount.' })
                } else {
                    throw err
                }
            }
        })
    )

    // GET /api/trades/me
    router.get(
        '/me',
        authenticate as any,
        asyncHandler(async (req: Request, res: Response) => {
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 50
            const result = await tradeService.getUserTrades(req.user!.id, page, limit)
            res.json(result)
        })
    )

    return router
}
