import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'
import { createMarketSchema, resolveMarketSchema } from '../types/schemas'
import { mapPolymarketCategory } from '../types/polymarket'

export class MarketService {
    constructor(private prisma: PrismaClient) {}

    async getAll(params?: { category?: string; sort?: 'volume' | 'newest' | 'closing_soon' }) {
        const { category, sort } = params || {}
        const now = new Date()

        const where: any = {
            resolvedAt: null,
            OR: [
                { closesAt: null },
                { closesAt: { gt: now } },
            ],
        }
        if (category) {
            where.category = category
        }

        const orderBy: any = []
        if (sort === 'volume') {
            orderBy.push({ volume: 'desc' })
        } else if (sort === 'newest') {
            orderBy.push({ createdAt: 'desc' })
        } else if (sort === 'closing_soon') {
            // Only markets with a future close date, nearest first
            where.closesAt = { gt: now }
            orderBy.push({ closesAt: 'asc' })
        } else {
            orderBy.push({ volume: 'desc' })
        }

        const markets = await this.prisma.market.findMany({
            where,
            orderBy,
            take: 100,
        })

        return markets.map(m => ({
            ...m,
            yesProb: Number(m.yesProb),
            volume: Number(m.volume),
        }))
    }

    async getById(id: string) {
        const market = await this.prisma.market.findUnique({
            where: { id },
        })

        if (!market) {
            throw new NotFoundError('Market not found')
        }

        return {
            ...market,
            yesProb: Number(market.yesProb),
            volume: Number(market.volume),
        }
    }

    async create(data: z.infer<typeof createMarketSchema>, creatorId: string) {
        const validData = createMarketSchema.parse(data)

        const market = await this.prisma.market.create({
            data: {
                id: require('uuid').v4(),
                title: validData.title,
                category: validData.category,
                yesProb: validData.yesProb,
                volume: 0,
                closesAt: new Date(validData.closesAt),
                createdById: creatorId,
            },
        })

        return {
            ...market,
            yesProb: Number(market.yesProb),
            volume: Number(market.volume),
        }
    }

    async resolve(marketId: string, outcome: boolean, resolverId: string) {
        const market = await this.prisma.market.findUnique({
            where: { id: marketId },
        })

        if (!market) {
            throw new NotFoundError('Market not found')
        }

        if (market.resolvedAt) {
            throw new BadRequestError('Market is already resolved')
        }

        // Start transaction
        return await this.prisma.$transaction(async (tx) => {
            // Mark market as resolved
            const updatedMarket = await tx.market.update({
                where: { id: marketId },
                data: {
                    resolvedAt: new Date(),
                    resolvedYes: outcome,
                },
            })

            // Find all winning positions and calculate payouts
            const winningSide = outcome ? 'YES' : 'NO'
            const winningPositions = await tx.position.findMany({
                where: {
                    marketId,
                    side: winningSide,
                },
            })

            // Update balances and create payout trades
            for (const position of winningPositions) {
                const payout = Number(position.shares) * 1.00

                await tx.user.update({
                    where: { id: position.userId },
                    data: {
                        paperBalance: {
                            increment: payout,
                        },
                    },
                })

                await tx.trade.create({
                    data: {
                        id: require('uuid').v4(),
                        userId: position.userId,
                        marketId,
                        side: position.side,
                        shares: position.shares,
                        price: 1.00,
                        amount: payout,
                        type: 'PAYOUT',
                    },
                })
            }

            return {
                ...updatedMarket,
                yesProb: Number(updatedMarket.yesProb),
                volume: Number(updatedMarket.volume),
            }
        })
    }

    // Polymarket sync methods
    async upsertFromPolymarket(marketData: any) {
        // Check if market already exists by polymarketId
        const existing = await this.prisma.market.findUnique({
            where: { polymarketId: marketData.id },
        })

        const category = mapPolymarketCategory(marketData.tags)

        // Parse outcome prices
        try {
            const prices = JSON.parse(marketData.outcomePrices)
            const yesPrice = parseFloat(prices[0])
            const yesProb = Math.round(yesPrice * 100)

            // Parse volume
            const volume = parseFloat(marketData.volume)

            if (isNaN(yesProb) || isNaN(volume) || !marketData.endDate) {
                return null // Skip invalid data
            }

            const updateData: any = {
                title: marketData.question,
                category,
                yesProb,
                volume,
                closesAt: new Date(marketData.endDate),
                polymarketSynced: true,
                imageUrl: marketData.image || null,
                description: marketData.description || null,
            }

            if (marketData.resolved && marketData.resolutionTime && !existing?.resolvedAt) {
                updateData.resolvedAt = new Date(marketData.resolutionTime)
                updateData.resolvedYes = marketData.winner === 'YES'
            }

            if (existing) {
                // Update existing market
                const updated = await this.prisma.market.update({
                    where: { id: existing.id },
                    data: updateData,
                })

                // Auto-resolve if market was resolved on Polymarket
                if (marketData.resolved && !existing.resolvedAt) {
                    await this.resolve(existing.id, marketData.winner === 'YES', 'system')
                }

                return { id: existing.id, action: 'updated' }
            } else {
                // Create new market
                const newMarket = await this.prisma.market.create({
                    data: {
                        id: require('uuid').v4(),
                        polymarketId: marketData.id,
                        polymarketSlug: marketData.slug,
                        ...updateData,
                        createdById: process.env.ADMIN_USER_ID || process.env.ADMIN_EMAIL, // Will be set by seed
                    },
                })

                return { id: newMarket.id, action: 'created' }
            }
        } catch (error) {
            console.error('Error parsing Polymarket data:', error)
            return null
        }
    }
}
