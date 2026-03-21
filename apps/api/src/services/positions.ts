import { PrismaClient } from '@prisma/client'
import { MarketService } from './markets'

export class PositionService {
    constructor(private prisma: PrismaClient) {}

    async getUserPositions(userId: string) {
        const positions = await this.prisma.position.findMany({
            where: { userId },
            include: {
                market: true,
            },
        })

        return positions.map(p => ({
            ...p,
            shares: Number(p.shares),
            avgPrice: Number(p.avgPrice),
            costBasis: Number(p.costBasis),
            market: {
                ...p.market,
                yesProb: Number(p.market.yesProb),
                volume: Number(p.market.volume),
            },
        }))
    }

    async getPosition(userId: string, marketId: string, side: 'YES' | 'NO') {
        const position = await this.prisma.position.findUnique({
            where: {
                userId_marketId_side: {
                    userId,
                    marketId,
                    side,
                },
            },
            include: {
                market: true,
            },
        })

        if (!position) {
            return null
        }

        return {
            ...position,
            shares: Number(position.shares),
            avgPrice: Number(position.avgPrice),
            costBasis: Number(position.costBasis),
            market: {
                ...position.market,
                yesProb: Number(position.market.yesProb),
                volume: Number(position.market.volume),
            },
        }
    }

    async getUserTotalValue(userId: string) {
        const positions = await this.prisma.position.findMany({
            where: { userId },
        })

        let totalPositionValue = 0
        for (const position of positions) {
            const market = await this.prisma.market.findUnique({
                where: { id: position.marketId },
            })

            if (market) {
                // Calculate current value based on market probability
                // YES position value = shares * (yesProb / 100)
                // NO position value = shares * ((100 - yesProb) / 100)
                const shares = Number(position.shares)
                if (position.side === 'YES') {
                    totalPositionValue += shares * (market.yesProb / 100)
                } else {
                    totalPositionValue += shares * ((100 - market.yesProb) / 100)
                }
            }
        }

        return totalPositionValue
    }
}
