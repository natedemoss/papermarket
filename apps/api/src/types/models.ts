import { z } from 'zod'

// Prisma output types
export const userSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string(),
    paperBalance: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    lastLoginAt: z.string().datetime().nullable(),
    avatarUrl: z.string().nullable(),
    isAdmin: z.boolean(),
})

export const marketSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    category: z.enum(['FINANCE', 'CRYPTO', 'TECH', 'SCIENCE', 'POLITICS', 'SPORTS', 'OTHER']),
    yesProb: z.number(),
    volume: z.number(),
    closesAt: z.string().datetime().nullable(),
    resolvedAt: z.string().datetime().nullable(),
    resolvedYes: z.boolean().nullable(),
    createdById: z.string().uuid(),
    createdAt: z.string().datetime(),
    polymarketId: z.string().nullable(),
    polymarketSlug: z.string().nullable(),
    polymarketSynced: z.boolean(),
    imageUrl: z.string().nullable(),
    description: z.string().nullable(),
})

export const positionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    marketId: z.string().uuid(),
    side: z.enum(['YES', 'NO']),
    shares: z.number(),
    avgPrice: z.number(),
    costBasis: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})

export const tradeSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    marketId: z.string().uuid(),
    side: z.enum(['YES', 'NO']),
    shares: z.number(),
    price: z.number(),
    amount: z.number(),
    type: z.enum(['BUY', 'SELL', 'PAYOUT']),
    createdAt: z.string().datetime(),
})

export const refreshTokenSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    token: z.string(),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime(),
})

// API response types
export type User = z.infer<typeof userSchema>
export type Market = z.infer<typeof marketSchema>
export type Position = z.infer<typeof positionSchema>
export type Trade = z.infer<typeof tradeSchema>
export type RefreshToken = z.infer<typeof refreshTokenSchema>

// Additional types for API responses
export type UserWithProfile = User & {
    totalTrades: number
    pnl: number
}

export type LeaderboardEntry = {
    rank: number
    user: User
    pnl: number
    totalTrades: number
}

export type PositionWithMarket = Position & {
    market: Market
}

export type TradeWithMarket = Trade & {
    market: Market
}
