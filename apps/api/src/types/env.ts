import { z } from 'zod'

const stringOrNull = z.string().nullable()

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('8080'),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    POLYMARKET_SYNC_ENABLED: z.enum(['true', 'false']).default('true'),
    POLYMARKET_SYNC_LIMIT: z.string().default('50'),
    ADMIN_EMAIL: z.string().default('admin@papermarket.com'),
    ADMIN_PASSWORD: z.string().default('admin123'),
})

export type EnvConfig = z.infer<typeof envSchema>
