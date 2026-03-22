import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import cron from 'node-cron'

import { PrismaClient } from '@prisma/client'
import { registerAuthRoutes } from './routes/auth'
import { registerUserRoutes } from './routes/users'
import { registerMarketRoutes } from './routes/markets'
import { registerTradeRoutes } from './routes/trades'
import { registerPositionRoutes } from './routes/positions'
import { registerAdminRoutes } from './routes/admin'
import { createErrorHandlingMiddleware } from './middleware/errorHandler'
import { validateRequest } from './middleware/validateRequest'
import { envSchema } from './types/env'

// Load environment variables
const env = envSchema.parse(process.env)

// Initialize Prisma client
export const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
})

// Express app setup
const app: Application = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(helmet())
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Please try again later',
        })
    },
})

// Static route for health check (no auth required)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public stats endpoint
app.get('/api/stats', async (req, res) => {
    const userCount = await prisma.user.count()
    res.json({ userCount })
})

// Mount route handlers
app.use('/api/auth', authLimiter, registerAuthRoutes(prisma))
app.use('/api/users', registerUserRoutes(prisma))
app.use('/api/markets', registerMarketRoutes(prisma))
app.use('/api/trades', registerTradeRoutes(prisma))
app.use('/api/positions', registerPositionRoutes(prisma))
app.use('/api/admin', registerAdminRoutes(prisma))

// Error handling middleware (must be last)
app.use(createErrorHandlingMiddleware())

// Start server
const startServer = async () => {
    try {
        // Check database connection
        await prisma.$connect()
        console.log('[db] Connected to PostgreSQL')

        // Register cron job for Polymarket sync
        if (env.POLYMARKET_SYNC_ENABLED === 'true') {
            const { PolymarketSyncService } = await import('./services/polymarketSync')
            const syncService = new PolymarketSyncService(prisma, parseInt(env.POLYMARKET_SYNC_LIMIT))

            cron.schedule('*/10 * * * *', async () => {
                try {
                    const result = await syncService.run()
                    console.log(`[sync] Synced ${result.synced} markets from Polymarket`)
                } catch (error) {
                    console.error('[sync] Error during sync:', error)
                }
            }, {
                timezone: 'UTC',
            })
            console.log('[sync] Polymarket sync started')
        }

        app.listen(PORT, () => {
            console.log(`[server] Server running on port ${PORT}`)
            console.log(`[server] Environment: ${env.NODE_ENV}`)
        })
    } catch (error) {
        console.error('[server] Failed to start:', error)
        process.exit(1)
    }
}

startServer()

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[server] SIGTERM received, shutting down gracefully...')
    await prisma.$disconnect()
    process.exit(0)
})
