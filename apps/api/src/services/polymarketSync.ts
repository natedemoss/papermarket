import { PrismaClient } from '@prisma/client'
import { MarketService } from './markets'

interface PolymarketMarket {
    id: string
    question: string
    slug: string
    description?: string
    image?: string
    endDate: string
    outcomePrices: string
    outcomes: string
    volume: string
    volumeNum?: number
    active: boolean
    closed: boolean
    resolved?: boolean
    resolutionTime?: string
    winner?: string
    events?: Array<{ tags?: Array<{ label?: string; slug?: string }> }>
    tags?: Array<{ label?: string; slug?: string } | string>
}

function parseYesProb(market: PolymarketMarket): number | null {
    try {
        const prices = typeof market.outcomePrices === 'string'
            ? JSON.parse(market.outcomePrices)
            : market.outcomePrices
        if (Array.isArray(prices) && prices.length > 0) {
            const prob = Math.round(parseFloat(prices[0]) * 100)
            if (prob >= 1 && prob <= 99) return prob
        }
    } catch {}
    return null
}

function parseCategory(market: PolymarketMarket): string {
    const tagSources = [
        ...(market.tags || []),
        ...((market.events || []).flatMap(e => e.tags || [])),
    ]
    const tagStr = tagSources
        .map(t => (typeof t === 'string' ? t : t.label || t.slug || ''))
        .join(' ')
        .toLowerCase()

    if (tagStr.includes('politic') || tagStr.includes('election') || tagStr.includes('government') || tagStr.includes('president')) return 'POLITICS'
    if (tagStr.includes('crypto') || tagStr.includes('bitcoin') || tagStr.includes('ethereum') || tagStr.includes('defi') || tagStr.includes('web3')) return 'CRYPTO'
    if (tagStr.includes('sport') || tagStr.includes('nba') || tagStr.includes('nfl') || tagStr.includes('mlb') || tagStr.includes('soccer') || tagStr.includes('tennis')) return 'SPORTS'
    if (tagStr.includes('tech') || tagStr.includes('ai') || tagStr.includes('technology') || tagStr.includes('openai') || tagStr.includes('apple')) return 'TECH'
    if (tagStr.includes('science') || tagStr.includes('health') || tagStr.includes('climate') || tagStr.includes('fda') || tagStr.includes('space')) return 'SCIENCE'
    if (tagStr.includes('finance') || tagStr.includes('stock') || tagStr.includes('fed') || tagStr.includes('economy') || tagStr.includes('rate')) return 'FINANCE'
    return 'OTHER'
}

export class PolymarketSyncService {
    private readonly apiBase = 'https://gamma-api.polymarket.com'
    private readonly marketService: MarketService
    private limit: number

    constructor(private prisma: PrismaClient, limit: number = 100) {
        this.marketService = new MarketService(prisma)
        this.limit = limit
    }

    async fetchTopMarkets(): Promise<PolymarketMarket[]> {
        try {
            const response = await fetch(
                `${this.apiBase}/markets?active=true&closed=false&limit=${this.limit}&order=volume24hr&ascending=false`
            )
            if (!response.ok) throw new Error(`Polymarket API returned ${response.status}`)
            const data = await response.json() as any
            return Array.isArray(data) ? data : (data.markets || [])
        } catch (error) {
            console.error('[sync] Error fetching Polymarket markets:', error)
            return []
        }
    }

    async upsertMarkets(markets: PolymarketMarket[]): Promise<{ synced: number; errors: string[] }> {
        const errors: string[] = []
        let synced = 0

        const admin = await this.prisma.user.findFirst({ where: { isAdmin: true } })
        if (!admin) {
            return { synced: 0, errors: ['No admin user found for sync'] }
        }

        const twoYearsOut = new Date()
        twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2)

        for (const m of markets) {
            try {
                if (!m.question || !m.endDate) continue

                const yesProb = parseYesProb(m)
                if (yesProb === null) continue

                const closeDate = new Date(m.endDate)
                if (closeDate < new Date()) continue  // skip already-closed markets
                if (closeDate > twoYearsOut) continue

                const volume = m.volumeNum ?? (parseFloat(m.volume || '0') || 0)
                const category = parseCategory(m)

                const existing = await this.prisma.market.findUnique({
                    where: { polymarketId: String(m.id) },
                })

                if (existing) {
                    await this.prisma.market.update({
                        where: { id: existing.id },
                        data: { yesProb, volume, closesAt: closeDate },
                    })

                    // Auto-resolve if Polymarket resolved it and we have positions
                    if (m.resolved && m.winner && !existing.resolvedAt) {
                        await this.marketService.resolve(existing.id, m.winner === 'Yes' || m.winner === 'YES', admin.id)
                    }
                } else {
                    await this.prisma.market.create({
                        data: {
                            polymarketId: String(m.id),
                            polymarketSlug: m.slug || null,
                            title: m.question,
                            description: m.description || null,
                            category,
                            yesProb,
                            volume,
                            closesAt: closeDate,
                            polymarketSynced: true,
                            imageUrl: m.image || null,
                            createdById: admin.id,
                            resolvedAt: m.resolved && m.resolutionTime ? new Date(m.resolutionTime) : null,
                            resolvedYes: m.resolved ? (m.winner === 'Yes' || m.winner === 'YES') : null,
                        },
                    })
                }
                synced++
            } catch (error) {
                errors.push(`Market ${m.id}: ${String(error)}`)
            }
        }

        return { synced, errors }
    }

    async run(): Promise<{ synced: number; errors: string[] }> {
        try {
            const markets = await this.fetchTopMarkets()
            return await this.upsertMarkets(markets)
        } catch (error) {
            console.error('[sync] Error during sync run:', error)
            return { synced: 0, errors: [String(error)] }
        }
    }
}
