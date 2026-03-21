const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

async function fetchAndSync() {
    // Fetch from Polymarket Gamma API
    const res = await fetch('https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=100&order=volume24hr&ascending=false')
    const data = await res.json()
    const markets = Array.isArray(data) ? data : (data.markets || [])

    console.log(`Fetched ${markets.length} markets`)
    if (markets.length > 0) {
        // Log first market structure to understand the format
        const sample = markets[0]
        console.log('Sample market keys:', Object.keys(sample))
        console.log('outcomePrices:', sample.outcomePrices)
        console.log('outcomes:', sample.outcomes)
        console.log('tokens:', sample.tokens?.slice(0,2))
    }

    // Get admin user
    const admin = await p.user.findFirst({ where: { isAdmin: true } })
    if (!admin) { console.error('No admin user found'); return }

    let synced = 0
    let skipped = 0

    for (const m of markets) {
        try {
            // Skip non-binary or missing data
            if (!m.question || !m.endDate) { skipped++; continue }

            // Parse yes probability from various possible fields
            let yesProb = 50
            if (m.outcomePrices) {
                try {
                    const prices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices
                    if (Array.isArray(prices) && prices.length > 0) {
                        yesProb = Math.round(parseFloat(prices[0]) * 100)
                    }
                } catch {}
            } else if (m.tokens && Array.isArray(m.tokens)) {
                const yesToken = m.tokens.find((t) => t.outcome === 'Yes' || t.outcome === 'YES')
                if (yesToken?.price) yesProb = Math.round(parseFloat(yesToken.price) * 100)
            } else if (m.bestBid) {
                yesProb = Math.round(parseFloat(m.bestBid) * 100)
            }

            if (yesProb < 1 || yesProb > 99) { skipped++; continue }

            // Parse volume
            const volume = parseFloat(m.volume || m.volumeNum || '0') || 0

            // Skip low-volume or far-future markets
            const closeDate = new Date(m.endDate)
            const twoYearsOut = new Date()
            twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2)
            if (closeDate > twoYearsOut) { skipped++; continue }

            // Map category from tags
            const tags = (m.tags || []).map((t) => (typeof t === 'string' ? t : t.label || t.slug || '')).join(' ').toLowerCase()
            let category = 'OTHER'
            if (tags.includes('politic') || tags.includes('election') || tags.includes('government')) category = 'POLITICS'
            else if (tags.includes('crypto') || tags.includes('bitcoin') || tags.includes('ethereum') || tags.includes('defi')) category = 'CRYPTO'
            else if (tags.includes('sport') || tags.includes('nba') || tags.includes('nfl') || tags.includes('soccer') || tags.includes('football')) category = 'SPORTS'
            else if (tags.includes('tech') || tags.includes('ai') || tags.includes('technology')) category = 'TECH'
            else if (tags.includes('science') || tags.includes('health') || tags.includes('climate')) category = 'SCIENCE'
            else if (tags.includes('finance') || tags.includes('stock') || tags.includes('market') || tags.includes('economy')) category = 'FINANCE'

            // Upsert by polymarketId
            const existing = await p.market.findUnique({ where: { polymarketId: String(m.id) } })
            if (existing) {
                await p.market.update({
                    where: { id: existing.id },
                    data: { yesProb, volume, closesAt: closeDate, polymarketSynced: true },
                })
            } else {
                await p.market.create({
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
                    },
                })
            }
            synced++
        } catch (e) {
            skipped++
        }
    }

    console.log(`Done. Synced: ${synced}, Skipped: ${skipped}`)
}

fetchAndSync().catch(console.error).finally(() => p.$disconnect())
