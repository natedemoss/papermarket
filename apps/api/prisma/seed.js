const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const p = new PrismaClient()

async function main() {
    // Admin user
    const hash = await bcrypt.hash('admin123', 10)
    const user = await p.user.upsert({
        where: { email: 'admin@papermarket.com' },
        update: {},
        create: {
            email: 'admin@papermarket.com',
            username: 'admin',
            passwordHash: hash,
            isAdmin: true,
            paperBalance: 10000,
        },
    })
    console.log('Admin ready:', user.username)

    // Delete old seeded markets (not polymarket-synced ones)
    await p.market.deleteMany({ where: { polymarketSynced: false } })
    console.log('Cleared old markets')

    const markets = [
        // POLITICS
        { title: 'Will Trump sign a new immigration bill by June 2026?', category: 'POLITICS', yesProb: 38, volume: 820000 },
        { title: 'Will Kamala Harris run for California Governor in 2026?', category: 'POLITICS', yesProb: 44, volume: 390000 },
        { title: 'Will the Democrats retake the House in 2026 midterms?', category: 'POLITICS', yesProb: 52, volume: 1200000 },
        { title: 'Will Trump be removed from office before 2027?', category: 'POLITICS', yesProb: 4, volume: 560000 },
        { title: 'Will a US-China trade deal be reached in 2026?', category: 'POLITICS', yesProb: 31, volume: 470000 },
        { title: 'Will the US impose new tariffs on EU goods in 2026?', category: 'POLITICS', yesProb: 57, volume: 340000 },
        { title: 'Will Elon Musk leave a government role by July 2026?', category: 'POLITICS', yesProb: 61, volume: 980000 },

        // CRYPTO
        { title: 'Will Bitcoin hit $120k before July 2026?', category: 'CRYPTO', yesProb: 42, volume: 2100000 },
        { title: 'Will Ethereum reach $5k in 2026?', category: 'CRYPTO', yesProb: 38, volume: 890000 },
        { title: 'Will the US pass a stablecoin regulation bill in 2026?', category: 'CRYPTO', yesProb: 55, volume: 430000 },
        { title: 'Will Solana flip Ethereum by market cap in 2026?', category: 'CRYPTO', yesProb: 14, volume: 310000 },
        { title: 'Will Bitcoin dominance stay above 50% through June 2026?', category: 'CRYPTO', yesProb: 67, volume: 270000 },
        { title: 'Will a spot Solana ETF be approved by end of 2026?', category: 'CRYPTO', yesProb: 48, volume: 520000 },
        { title: 'Will XRP reach $5 before September 2026?', category: 'CRYPTO', yesProb: 33, volume: 410000 },

        // FINANCE
        { title: 'Will the Fed cut rates at the May 2026 meeting?', category: 'FINANCE', yesProb: 29, volume: 750000 },
        { title: 'Will the Fed cut rates at least twice in 2026?', category: 'FINANCE', yesProb: 44, volume: 920000 },
        { title: 'Will the S&P 500 hit 6500 before July 2026?', category: 'FINANCE', yesProb: 48, volume: 680000 },
        { title: 'Will US inflation drop below 2.5% by June 2026?', category: 'FINANCE', yesProb: 36, volume: 310000 },
        { title: 'Will the US enter a recession in 2026?', category: 'FINANCE', yesProb: 27, volume: 540000 },
        { title: 'Will gold reach $3500/oz in 2026?', category: 'FINANCE', yesProb: 41, volume: 290000 },
        { title: 'Will the 10-year Treasury yield drop below 4% in 2026?', category: 'FINANCE', yesProb: 35, volume: 210000 },

        // TECH
        { title: 'Will OpenAI release GPT-5 before July 2026?', category: 'TECH', yesProb: 58, volume: 640000 },
        { title: 'Will Apple release an AI-powered Siri overhaul in 2026?', category: 'TECH', yesProb: 72, volume: 380000 },
        { title: 'Will Google lose its default search deal with Apple?', category: 'TECH', yesProb: 39, volume: 490000 },
        { title: 'Will a major AI lab face US government regulation in 2026?', category: 'TECH', yesProb: 63, volume: 350000 },
        { title: 'Will Meta release a standalone AR glasses product in 2026?', category: 'TECH', yesProb: 44, volume: 270000 },
        { title: 'Will TikTok be banned in the US by end of 2026?', category: 'TECH', yesProb: 31, volume: 810000 },
        { title: 'Will Nvidia stay the most valuable company by July 2026?', category: 'TECH', yesProb: 55, volume: 420000 },

        // SPORTS
        { title: 'Will the Golden State Warriors make the 2026 NBA playoffs?', category: 'SPORTS', yesProb: 62, volume: 180000 },
        { title: 'Will Patrick Mahomes win Super Bowl LX?', category: 'SPORTS', yesProb: 28, volume: 490000 },
        { title: 'Will the New York Yankees win the 2026 World Series?', category: 'SPORTS', yesProb: 18, volume: 210000 },
        { title: 'Will Caitlin Clark win WNBA MVP in 2026?', category: 'SPORTS', yesProb: 45, volume: 340000 },
        { title: 'Will Novak Djokovic win a Grand Slam in 2026?', category: 'SPORTS', yesProb: 37, volume: 160000 },
        { title: 'Will the US win the most gold medals at 2026 Winter Olympics?', category: 'SPORTS', yesProb: 31, volume: 290000 },
        { title: 'Will Lionel Messi retire from professional soccer in 2026?', category: 'SPORTS', yesProb: 48, volume: 420000 },

        // SCIENCE
        { title: 'Will the FDA approve a new weight-loss drug in 2026?', category: 'SCIENCE', yesProb: 66, volume: 310000 },
        { title: 'Will a bird flu (H5N1) human-to-human cluster be confirmed in 2026?', category: 'SCIENCE', yesProb: 22, volume: 480000 },
        { title: 'Will a nuclear fusion milestone be achieved in 2026?', category: 'SCIENCE', yesProb: 29, volume: 190000 },
        { title: 'Will a humanoid robot be deployed in a major US factory by 2026?', category: 'SCIENCE', yesProb: 71, volume: 250000 },
    ]

    let created = 0
    for (const m of markets) {
        await p.market.create({
            data: { ...m, createdById: user.id, closesAt: new Date('2026-12-31') },
        })
        created++
    }

    console.log(`Created ${created} markets. Seeding complete.`)
}

main().catch(console.error).finally(() => p.$disconnect())
