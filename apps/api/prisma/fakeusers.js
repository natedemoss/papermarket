// Run with: node prisma/fakeusers.js
// Creates 300 fake users and randomized trades on existing markets

const { PrismaClient } = require('@prisma/client')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

// Just first names — feel like real people
const justNames = [
    'alex','jordan','morgan','taylor','casey','riley','quinn','avery','drew','blake',
    'reese','logan','parker','sawyer','rowan','james','oliver','liam','noah','ethan',
    'mason','lucas','jack','owen','theo','henry','leo','daniel','ryan','nolan',
    'miles','evan','caleb','eli','aaron','isaac','cole','felix','sean','jake',
    'emma','sophia','ava','mia','ella','aria','luna','chloe','layla','zoey',
    'nora','lily','stella','zoe','leah','hazel','violet','aurora','claire','anna',
    'maya','nova','ivy','jade','ruby','skye','nina','sara','kate','june',
]

// Short cool words — vibes like rain, nexta, occisor
const coolWords = [
    'rain','nexta','occisor','velt','kael','dusk','flux','echo','drift','frost',
    'vale','crest','zion','onyx','sol','riven','axon','lyric','seren','cobalt',
    'maren','cypher','wren','arlo','juno','orion','atlas','nova','zenith','arc',
    'cole','lux','vex','rho','sable','haven','kira','thorn','ember','dax',
    'sloane','brix','quill','flint','trace','vance','nox','hex','ash','greer',
    'lore','bryn','cael','reed','pax','rue','fenn','bay','crew','vale',
    'wick','dune','sora','zane','blythe','cove','elio','shaw','rome','wolf',
]

function randItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min, max) {
    return Math.random() * (max - min) + min
}

async function main() {
    console.log('👥 Creating fake users and trades...')

    // Fetch active markets to trade on
    const now = new Date()
    const markets = await prisma.market.findMany({
        where: {
            resolvedAt: null,
            yesProb: { gte: 5, lte: 95 },
            OR: [{ closesAt: null }, { closesAt: { gt: now } }],
        },
        take: 100,
    })

    if (markets.length === 0) {
        console.error('No active markets found. Run a sync first.')
        return
    }

    console.log(`Found ${markets.length} active markets to trade on`)

    let usersCreated = 0
    let tradesCreated = 0
    const usedUsernames = new Set()

    for (let i = 0; i < 300; i++) {
        // Generate unique username — mix of styles so they look organic
        let username
        let attempts = 0
        do {
            const style = randInt(0, 3)
            if (style === 0) {
                // Just a first name, maybe with a short number: alex, maya23
                const name = randItem(justNames)
                username = Math.random() > 0.5 ? name : `${name}${randInt(1, 99)}`
            } else if (style === 1) {
                // Cool word, maybe with number: rain, frost7
                const word = randItem(coolWords)
                username = Math.random() > 0.6 ? word : `${word}${randInt(1, 99)}`
            } else if (style === 2) {
                // Two cool words or name+word: ashwolf, junefrost
                username = `${randItem(coolWords)}${randItem(coolWords)}`
            } else {
                // Name + cool word: alexdusk, novarain
                username = `${randItem(justNames)}${randItem(coolWords)}`
            }
            attempts++
        } while (usedUsernames.has(username) && attempts < 20)
        usedUsernames.add(username)

        const email = `${username}@fake.papermarket.com`

        // Skip if already exists
        const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
        if (existing) continue

        const startingBalance = randFloat(500, 5000)
        const user = await prisma.user.create({
            data: {
                id: uuidv4(),
                username,
                email,
                passwordHash: '$2b$12$fakehashnotloginablethistoken000000000000000000000000', // not login-able
                paperBalance: startingBalance,
                isAdmin: false,
            },
        })
        usersCreated++

        // Each user makes 1–6 trades
        const numTrades = randInt(1, 6)
        let balance = startingBalance

        for (let t = 0; t < numTrades; t++) {
            const market = randItem(markets)
            const side = Math.random() > 0.5 ? 'YES' : 'NO'
            const yesProb = Number(market.yesProb)
            const pricePerShare = side === 'YES' ? yesProb / 100 : (100 - yesProb) / 100

            // Bet between $5 and 20% of current balance
            const maxBet = Math.min(balance * 0.2, 200)
            if (maxBet < 5) break
            const amount = Math.round(randFloat(5, maxBet) * 100) / 100
            const shares = amount / pricePerShare

            // Deduct balance
            balance -= amount

            // Upsert position
            const posKey = { userId: user.id, marketId: market.id, side }
            const existingPos = await prisma.position.findUnique({ where: { userId_marketId_side: posKey } })

            if (existingPos) {
                const totalShares = Number(existingPos.shares) + shares
                const newAvgPrice = Math.min(99.99,
                    ((Number(existingPos.shares) * Number(existingPos.avgPrice)) + (shares * pricePerShare * 100)) / totalShares
                )
                await prisma.position.update({
                    where: { userId_marketId_side: posKey },
                    data: {
                        shares: { increment: shares },
                        avgPrice: newAvgPrice,
                        costBasis: { increment: amount },
                    },
                })
            } else {
                await prisma.position.create({
                    data: {
                        id: uuidv4(),
                        userId: user.id,
                        marketId: market.id,
                        side,
                        shares,
                        avgPrice: pricePerShare * 100,
                        costBasis: amount,
                    },
                })
            }

            // Create trade record with a random timestamp in the past 30 days
            const daysAgo = randInt(0, 30)
            const tradeDate = new Date()
            tradeDate.setDate(tradeDate.getDate() - daysAgo)
            tradeDate.setMinutes(tradeDate.getMinutes() - randInt(0, 1440))

            await prisma.trade.create({
                data: {
                    id: uuidv4(),
                    userId: user.id,
                    marketId: market.id,
                    side,
                    shares,
                    price: pricePerShare,
                    amount,
                    type: 'BUY',
                    createdAt: tradeDate,
                },
            })

            // Bump market volume slightly
            await prisma.market.update({
                where: { id: market.id },
                data: { volume: { increment: amount } },
            })

            tradesCreated++
        }

        // Update user balance to reflect trades
        await prisma.user.update({
            where: { id: user.id },
            data: { paperBalance: Math.max(0, balance) },
        })

        if (usersCreated % 50 === 0) {
            console.log(`  Created ${usersCreated} users, ${tradesCreated} trades so far...`)
        }
    }

    console.log(`\n✅ Done! Created ${usersCreated} fake users and ${tradesCreated} trades.`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
