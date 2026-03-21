const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const p = new PrismaClient()

async function main() {
    const adminPassword = process.env.ADMIN_PASSWORD || 'PaperAdmin2025!'
    const hash = await bcrypt.hash(adminPassword, 10)

    const user = await p.user.upsert({
        where: { email: 'admin@papermarket.com' },
        update: { passwordHash: hash },
        create: {
            email: 'admin@papermarket.com',
            username: 'admin',
            passwordHash: hash,
            isAdmin: true,
            paperBalance: 10000,
        },
    })

    console.log('Admin ready:', user.username)

    // Remove any leftover non-Polymarket markets
    const deleted = await p.market.deleteMany({ where: { polymarketSynced: false } })
    if (deleted.count > 0) console.log(`Removed ${deleted.count} non-Polymarket markets`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => p.$disconnect())
