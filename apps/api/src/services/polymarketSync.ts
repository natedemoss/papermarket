import { PrismaClient } from '@prisma/client'
import { GammaMarket, mapPolymarketCategory } from '../types/polymarket'
import { MarketService } from './markets'

export class PolymarketSyncService {
    private readonly apiBase = 'https://gamma-api.polymarket.com'
    private readonly marketService: MarketService

    constructor(private prisma: PrismaClient, limit: number = 50) {
        this.marketService = new MarketService(prisma)
        this.limit = limit
    }

    private limit: number

    async fetchTopMarkets(): Promise<GammaMarket[]> {
        try {
            const response = await fetch(
                `${this.apiBase}/markets?active=true&closed=false&limit=${this.limit}&order=volume24hr&ascending=false`
            )

            if (!response.ok) {
                throw new Error(`Polymarket API returned ${response.status}`)
            }

            const data = await response.json() as any
            return (data.markets || data) as GammaMarket[]
        } catch (error) {
            console.error('Error fetching Polymarket markets:', error)
            return []
        }
    }

    async upsertMarkets(markets: GammaMarket[]): Promise<{ synced: number; errors: string[] }> {
        const synced: string[] = []
        const errors: string[] = []

        // Get system admin user (created during seeding)
        const adminUser = await this.prisma.user.findFirst({
            where: {
                isAdmin: true,
            },
        })

        const adminUserId = adminUser?.id || 'system'

        for (const market of markets) {
            try {
                // Check if market already exists by polymarketId
                const existing = await this.prisma.market.findUnique({
                    where: { polymarketId: market.id },
                })

                const category = mapPolymarketCategory(market.tags)

                // Parse outcome prices
                try {
                    const prices = JSON.parse(market.outcomePrices)
                    const yesPrice = parseFloat(prices[0])
                    const yesProb = Math.round(yesPrice * 100)

                    // Parse volume
                    const volume = parseFloat(market.volume)

                    if (isNaN(yesProb) || isNaN(volume) || !market.endDate) {
                        errors.push(`Invalid data for market ${market.id}`)
                        continue
                    }

                    const updateData: any = {
                        title: market.question,
                        category,
                        yesProb,
                        volume,
                        closesAt: new Date(market.endDate),
                        polymarketSynced: true,
                        imageUrl: market.image || null,
                        description: market.description || null,
                    }

                    if (market.resolved && market.resolutionTime && !existing?.resolvedAt) {
                        updateData.resolvedAt = new Date(market.resolutionTime)
                        updateData.resolvedYes = market.winner === 'YES'
                    }

                    if (existing) {
                        // Update existing market
                        const updated = await this.prisma.market.update({
                            where: { id: existing.id },
                            data: updateData,
                        })

                        synced.push(existing.id)

                        // Auto-resolve if market was resolved on Polymarket
                        if (market.resolved && !existing.resolvedAt) {
                            await this.marketService.resolve(existing.id, market.winner === 'YES', adminUserId)
                        }
                    } else {
                        // Create new market
                        const newMarket = await this.prisma.market.create({
                            data: {
                                id: require('uuid').v4(),
                                polymarketId: market.id,
                                polymarketSlug: market.slug,
                                ...updateData,
                                createdById: adminUserId,
                            },
                        })

                        synced.push(newMarket.id)
                    }
                } catch (parseError) {
                    errors.push(`Parse error for market ${market.id}: ${String(parseError)}`)
                }
            } catch (error) {
                errors.push(`Error processing market ${market.id}: ${String(error)}`)
            }
        }

        return { synced: synced.length, errors }
    }

    async run(): Promise<{ synced: number; errors: string[] }> {
        try {
            const markets = await this.fetchTopMarkets()
            return await this.upsertMarkets(markets)
        } catch (error) {
            console.error('Error in Polymarket sync run:', error)
            return { synced: 0, errors: [String(error)] }
        }
    }
}
