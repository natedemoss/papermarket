import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create admin user
    const adminId = uuidv4()
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@papermarket.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    })

    let admin
    if (existingAdmin) {
        admin = existingAdmin
        console.log('✓ Admin user already exists')
    } else {
        const hashedPassword = await bcrypt.hash(adminPassword, 12)
        admin = await prisma.user.create({
            data: {
                id: adminId,
                username: 'admin',
                email: adminEmail,
                passwordHash: hashedPassword,
                paperBalance: 10000.00,
                isAdmin: true,
            },
        })
        console.log(`✓ Admin user created: ${adminEmail}`)
    }

    // Seed with live Polymarket data if enabled
    if (process.env.POLYMARKET_SYNC_ENABLED === 'true') {
        console.log('📡 Syncing markets from Polymarket...')
        try {
            const { PolymarketSyncService } = await import('../dist/services/polymarketSync.js')
            const syncService = new PolymarketSyncService(prisma)
            const result = await syncService.run()
            console.log(`✓ Synced ${result.synced} markets from Polymarket`)
            if (result.errors.length > 0) {
                console.log(`⚠ Encountered ${result.errors.length} errors during sync`)
            }
        } catch (error) {
            console.error('⚠ Failed to sync Polymarket data:', error)
            console.log('📝 Creating default markets instead...')
            await createDefaultMarkets(admin.id)
        }
    } else {
        console.log('📝 Creating default markets...')
        await createDefaultMarkets(admin.id)
    }

    // Create sample users
    const sampleUsers = [
        { username: 'alice', email: 'alice@example.com' },
        { username: 'bob', email: 'bob@example.com' },
        { username: 'charlie', email: 'charlie@example.com' },
    ]

    for (const userData of sampleUsers) {
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        })

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash('password123', 12)
            await prisma.user.create({
                data: {
                    id: uuidv4(),
                    username: userData.username,
                    email: userData.email,
                    passwordHash: hashedPassword,
                    paperBalance: 1000.00,
                    isAdmin: false,
                },
            })
            console.log(`✓ Created user: ${userData.username}`)
        }
    }

    console.log('✅ Seeding complete!')
}

async function createDefaultMarkets(creatorId: string) {
    const defaultMarkets = [
        {
            title: 'Will Bitcoin reach $100k by end of 2025?',
            category: 'CRYPTO',
            yesProb: 65,
            closesAt: new Date('2025-12-31'),
        },
        {
            title: 'Will the Fed cut rates in the next 6 months?',
            category: 'FINANCE',
            yesProb: 45,
            closesAt: new Date('2025-09-30'),
        },
        {
            title: 'Will a new LLM surpass GPT-4 this year?',
            category: 'TECH',
            yesProb: 72,
            closesAt: new Date('2025-12-31'),
        },
        {
            title: 'Will the S&P 500 end 2025 above 6000?',
            category: 'FINANCE',
            yesProb: 58,
            closesAt: new Date('2025-12-31'),
        },
        {
            title: 'Will climate change limit warming to 1.5°C?',
            category: 'SCIENCE',
            yesProb: 15,
            closesAt: new Date('2026-06-30'),
        },
        {
            title: 'Will the Lakers win the 2026 NBA championship?',
            category: 'SPORTS',
            yesProb: 35,
            closesAt: new Date('2026-06-30'),
        },
    ]

    for (const market of defaultMarkets) {
        const existing = await prisma.market.findFirst({
            where: { title: market.title },
        })

        if (!existing) {
            await prisma.market.create({
                data: {
                    id: uuidv4(),
                    title: market.title,
                    category: market.category,
                    yesProb: market.yesProb,
                    closesAt: market.closesAt,
                    createdById: creatorId,
                    volume: 0,
                },
            })
            console.log(`✓ Created market: ${market.title}`)
        }
    }
}

main()
    .catch((e) => {
        console.error('Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
