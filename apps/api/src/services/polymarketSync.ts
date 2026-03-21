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
    events?: Array<{
        title?: string
        slug?: string
        tags?: Array<{ label?: string; slug?: string }>
        series?: Array<{ title?: string; slug?: string }>
    }>
    tags?: Array<{ label?: string; slug?: string } | string>
    clobTokenIds?: string  // JSON array of token IDs
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
    const parts: string[] = []

    // Tags (legacy)
    ;(market.tags || []).forEach(t =>
        parts.push(typeof t === 'string' ? t : (t.label || t.slug || ''))
    )

    // Event title, slug, and series info (current Polymarket format)
    ;(market.events || []).forEach(e => {
        if (e.title) parts.push(e.title)
        if (e.slug) parts.push(e.slug)
        ;(e.tags || []).forEach(t => parts.push(t.label || t.slug || ''))
        ;(e.series || []).forEach(s => {
            if (s.title) parts.push(s.title)
            if (s.slug) parts.push(s.slug)
        })
    })

    // Also include the market question itself
    if (market.question) parts.push(market.question)
    if (market.slug) parts.push(market.slug)

    const s = parts.join(' ').toLowerCase()

    if (s.includes('politic') || s.includes('election') || s.includes('president') || s.includes('senate') || s.includes('congress') || s.includes('government') || s.includes('vote') || s.includes('ballot') || s.includes('democrat') || s.includes('republican') || s.includes('trump') || s.includes('biden') || s.includes('harris')) return 'POLITICS'
    if (s.includes('bitcoin') || s.includes('ethereum') || s.includes('crypto') || s.includes(' btc') || s.includes(' eth') || s.includes('defi') || s.includes('solana') || s.includes('coinbase') || s.includes('blockchain') || s.includes('token') || s.includes('nft')) return 'CRYPTO'
    if (s.includes('nba') || s.includes('nfl') || s.includes('mlb') || s.includes('nhl') || s.includes('soccer') || s.includes('football') || s.includes('basketball') || s.includes('baseball') || s.includes('tennis') || s.includes('golf') || s.includes('ufc') || s.includes('mma') || s.includes('premier league') || s.includes('champions league') || s.includes('world cup') || s.includes('ncaa') || s.includes('super bowl') || s.includes('nascar') || s.includes('formula') || s.includes(' f1 ') || s.includes('esport') || s.includes('league of legends') || s.includes('cs2') || s.includes('dota') || s.includes('valorant') || s.includes('match') || s.includes(' vs ') || s.includes(' win ') || s.includes('champion') || s.includes('playoff') || s.includes('tournament') || s.includes('series')) return 'SPORTS'
    if (s.includes('openai') || s.includes('chatgpt') || s.includes('anthropic') || s.includes('google') || s.includes('apple') || s.includes('microsoft') || s.includes('meta ') || s.includes('nvidia') || s.includes(' ai ') || s.includes('artificial intelligence') || s.includes('tech') || s.includes('software') || s.includes('startup') || s.includes('ipo') || s.includes('elon') || s.includes('musk') || s.includes('spacex')) return 'TECH'
    if (s.includes('climate') || s.includes('science') || s.includes('health') || s.includes('fda') || s.includes('drug') || s.includes('vaccine') || s.includes('nasa') || s.includes('space') || s.includes('asteroid') || s.includes('covid') || s.includes('disease')) return 'SCIENCE'
    if (s.includes('fed ') || s.includes('federal reserve') || s.includes('interest rate') || s.includes('inflation') || s.includes('gdp') || s.includes('recession') || s.includes('stock') || s.includes('market cap') || s.includes('economy') || s.includes('finance') || s.includes('bank') || s.includes('treasury') || s.includes('s&p') || s.includes('dow') || s.includes('nasdaq')) return 'FINANCE'
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
        const all: PolymarketMarket[] = []
        const pageSize = 100
        const maxPages = Math.ceil(this.limit / pageSize)

        try {
            for (let page = 0; page < maxPages; page++) {
                const offset = page * pageSize
                const fetchLimit = Math.min(pageSize, this.limit - offset)
                const response = await fetch(
                    `${this.apiBase}/markets?active=true&closed=false&limit=${fetchLimit}&offset=${offset}&order=volume24hr&ascending=false`
                )
                if (!response.ok) throw new Error(`Polymarket API returned ${response.status}`)
                const data = await response.json() as any
                const batch: PolymarketMarket[] = Array.isArray(data) ? data : (data.markets || [])
                if (batch.length === 0) break
                all.push(...batch)
                if (batch.length < pageSize) break
            }
        } catch (error) {
            console.error('[sync] Error fetching Polymarket markets:', error)
        }

        return all
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

                const outcomes = m.outcomes
                    ? JSON.stringify(
                        (typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes)
                            .slice(0, 2)
                      )
                    : null

                const clobTokenIds = m.clobTokenIds ?? null

                if (existing) {
                    await this.prisma.market.update({
                        where: { id: existing.id },
                        data: { yesProb, volume, closesAt: closeDate, outcomes, category, clobTokenIds },
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
                            outcomes,
                            clobTokenIds,
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
