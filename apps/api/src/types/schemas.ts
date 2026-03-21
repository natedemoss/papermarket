import { z } from 'zod'

// Common validation schemas
export const usernameSchema = z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

export const emailSchema = z.string()
    .email('Invalid email address')

export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')

export const nonEmptyStringSchema = z.string().min(1)

// Auth schemas
export const registerSchema = z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
})

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
})

export const refreshTokenSchema = z.object({
    refreshToken: z.string(),
})

// User schemas
export const updateUserSchema = z.object({
    username: usernameSchema.optional(),
    avatarUrl: z.string().url().optional().nullable(),
})

// Market schemas
export const marketCategorySchema = z.enum(['FINANCE', 'CRYPTO', 'TECH', 'SCIENCE', 'POLITICS', 'SPORTS', 'OTHER'])

export const createMarketSchema = z.object({
    title: nonEmptyStringSchema,
    category: marketCategorySchema,
    yesProb: z.number().int().min(0).max(100),
    closesAt: z.string().datetime(),
})

export const resolveMarketSchema = z.object({
    outcome: z.boolean(),
})

// Trade schemas
export const tradeSideSchema = z.enum(['YES', 'NO'])
export const tradeTypeSchema = z.enum(['BUY', 'SELL', 'PAYOUT'])

export const placeTradeSchema = z.object({
    marketId: z.string().uuid(),
    side: tradeSideSchema,
    amount: z.number().positive(),
})

// Utility schemas
export const uuidSchema = z.string().uuid()
