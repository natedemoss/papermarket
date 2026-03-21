import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { MarketService } from '../services/markets'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import { createMarketSchema, resolveMarketSchema } from '../types/schemas'

const commentSchema = z.object({
    content: z.string().min(1).max(500).trim(),
})

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

    // GET /api/markets/:id/comments
    router.get(
        '/:id/comments',
        asyncHandler(async (req: Request, res: Response) => {
            const comments = await prisma.comment.findMany({
                where: { marketId: req.params.id },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            })
            res.json(comments)
        })
    )

    // POST /api/markets/:id/comments
    router.post(
        '/:id/comments',
        authenticate as any,
        asyncHandler(async (req: Request, res: Response) => {
            const { content } = commentSchema.parse(req.body)
            const comment = await prisma.comment.create({
                data: {
                    marketId: req.params.id,
                    userId: req.user!.id,
                    content,
                },
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                },
            })
            res.status(201).json(comment)
        })
    )

    // DELETE /api/markets/:id/comments/:commentId
    router.delete(
        '/:id/comments/:commentId',
        authenticate as any,
        asyncHandler(async (req: Request, res: Response) => {
            const comment = await prisma.comment.findUnique({
                where: { id: req.params.commentId },
            })
            if (!comment) { res.status(404).json({ error: 'Comment not found' }); return }
            if (comment.userId !== req.user!.id && !req.user!.isAdmin) {
                res.status(403).json({ error: 'Not authorized' }); return
            }
            await prisma.comment.delete({ where: { id: req.params.commentId } })
            res.json({ success: true })
        })
    )

    return router
}
