// Run with: node prisma/fakeusers.js
// Creates 300 fake users and randomized trades on existing markets

const { PrismaClient } = require('@prisma/client')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

const firstNames = [
    'alex','jordan','morgan','taylor','casey','riley','skyler','quinn','avery','drew',
    'blake','reese','cameron','peyton','logan','hayden','parker','sawyer','rowan','finley',
    'james','emma','oliver','sophia','liam','ava','noah','isabella','william','mia',
    'ethan','charlotte','mason','amelia','lucas','harper','aiden','evelyn','jackson','abigail',
    'sebastian','emily','mateo','elizabeth','jack','mila','owen','ella','theo','scarlett',
    'henry','aria','leo','luna','daniel','chloe','michael','penelope','samuel','layla',
    'david','riley','joseph','zoey','carter','nora','wyatt','lily','john','eleanor',
    'luke','hannah','julian','lillian','gabriel','addison','andrew','aubrey','caleb','ellie',
    'isaac','stella','eli','natalia','connor','zoe','evan','leah','aaron','hazel',
    'charles','violet','thomas','aurora','christopher','savannah','jaxon','audrey','colton','brooklyn',
    'jayden','bella','axel','claire','levi','skylar','miles','lucy','ryan','paisley',
    'nolan','everly','hudson','anna','hunter','caroline','bentley','genesis','easton','kennedy',
]

const lastNames = [
    'smith','johnson','williams','jones','brown','davis','miller','wilson','moore','taylor',
    'anderson','thomas','jackson','white','harris','martin','thompson','garcia','martinez','robinson',
    'clark','rodriguez','lewis','lee','walker','hall','allen','young','hernandez','king',
    'wright','lopez','hill','scott','green','adams','baker','gonzalez','nelson','carter',
    'mitchell','perez','roberts','turner','phillips','campbell','parker','evans','edwards','collins',
    'stewart','sanchez','morris','rogers','reed','cook','morgan','bell','murphy','bailey',
    'rivera','cooper','richardson','cox','howard','ward','torres','peterson','gray','ramirez',
    'james','watson','brooks','kelly','sanders','price','bennett','wood','barnes','ross',
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
        // Generate unique username
        let username
        let attempts = 0
        do {
            const first = randItem(firstNames)
            const last = randItem(lastNames)
            const num = randInt(1, 999)
            username = `${first}${last}${num > 900 ? '' : num > 500 ? num : ''}`
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
