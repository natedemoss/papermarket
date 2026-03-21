import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'
import { tradeSideSchema, placeTradeSchema } from '../types/schemas'

export class TradeService {
    constructor(private prisma: PrismaClient) {}

    async place(userId: string, data: z.infer<typeof placeTradeSchema>) {
        const validData = placeTradeSchema.parse(data)
        const { marketId, side, amount } = validData

        // Fetch market and user
        const market = await this.prisma.market.findUnique({
            where: { id: marketId },
        })

        if (!market) {
            throw new NotFoundError('Market not found')
        }

        if (market.resolvedAt) {
            throw new BadRequestError('Cannot trade on resolved market')
        }

        if (Number(market.yesProb) <= 1 || Number(market.yesProb) >= 99) {
            throw new BadRequestError('Market odds are too extreme to trade')
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            throw new NotFoundError('User not found')
        }

        // Calculate price per share based on market probability
        // YES = probability of yes, NO = probability of no
        const pricePerShare = side === 'YES'
            ? market.yesProb / 100
            : (100 - market.yesProb) / 100

        const shares = amount / pricePerShare

        // Check if user has sufficient balance
        if (Number(user.paperBalance) < amount) {
            throw new BadRequestError('Insufficient paper balance')
        }

        // Start transaction
        return await this.prisma.$transaction(async (tx) => {
            // Deduct from user balance
            await tx.user.update({
                where: { id: userId },
                data: {
                    paperBalance: {
                        decrement: amount,
                    },
                },
            })

            // Calculate cost basis for position
            const costBasis = amount

            // Fetch existing position to calculate weighted average price
            const existing = await tx.position.findUnique({
                where: { userId_marketId_side: { userId, marketId, side } },
            })

            let position
            if (existing) {
                const totalShares = Number(existing.shares) + shares
                const newAvgPrice = Math.min(99.99, ((Number(existing.shares) * Number(existing.avgPrice)) + (shares * pricePerShare * 100)) / totalShares)
                position = await tx.position.update({
                    where: { userId_marketId_side: { userId, marketId, side } },
                    data: {
                        shares: { increment: shares },
                        avgPrice: newAvgPrice,
                        costBasis: { increment: costBasis },
                    },
                })
            } else {
                position = await tx.position.create({
                    data: {
                        id: require('uuid').v4(),
                        userId,
                        marketId,
                        side,
                        shares,
                        avgPrice: pricePerShare * 100,
                        costBasis,
                    },
                })
            }

            // Create trade record
            const trade = await tx.trade.create({
                data: {
                    id: require('uuid').v4(),
                    userId,
                    marketId,
                    side,
                    shares,
                    price: pricePerShare,
                    amount,
                    type: 'BUY',
                },
                include: {
                    market: true,
                },
            })

            // Shift probability based on trade size, capped between 3 and 97
            const shift = Math.min(5, amount / 100)
            const rawProb = side === 'YES'
                ? market.yesProb + shift
                : market.yesProb - shift
            const newYesProb = Math.max(3, Math.min(97, Math.round(rawProb)))

            await tx.market.update({
                where: { id: marketId },
                data: {
                    volume: { increment: amount },
                    yesProb: newYesProb,
                },
            })

            // Refresh data
            const updatedUser = await tx.user.findUnique({
                where: { id: userId },
            })
            const updatedPosition = await tx.position.findUnique({
                where: { id: position.id },
            })

            return {
                trade: trade,
                position: {
                    ...updatedPosition!,
                    shares: Number(updatedPosition!.shares),
                    avgPrice: Number(updatedPosition!.avgPrice),
                    costBasis: Number(updatedPosition!.costBasis),
                },
                userBalance: updatedUser!.paperBalance,
            }
        })
    }

    async getUserTrades(userId: string, page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit

        const trades = await this.prisma.trade.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                market: true,
            },
        })

        const total = await this.prisma.trade.count({
            where: { userId },
        })

        return {
            trades: trades.map(t => ({
                ...t,
                price: Number(t.price),
                amount: Number(t.amount),
                shares: Number(t.shares),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    async getTradeById(tradeId: string) {
        const trade = await this.prisma.trade.findUnique({
            where: { id: tradeId },
            include: {
                market: true,
            },
        })

        if (!trade) {
            throw new NotFoundError('Trade not found')
        }

        return {
            ...trade,
            price: Number(trade.price),
            amount: Number(trade.amount),
            shares: Number(trade.shares),
        }
    }
}
