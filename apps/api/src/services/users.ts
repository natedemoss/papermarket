import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { NotFoundError } from '../middleware/errorHandler'
import { registerSchema, updateUserSchema } from '../types/schemas'

const SALT_ROUNDS = 12

export class UserService {
    constructor(private prisma: PrismaClient) {}

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                paperBalance: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                avatarUrl: true,
                isAdmin: true,
            },
        })
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        })
    }

    async create(data: z.infer<typeof registerSchema>) {
        const { username, email, password } = registerSchema.parse(data)

        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        })
        if (existingUser) {
            throw new Error('User with this email already exists')
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

        const user = await this.prisma.user.create({
            data: {
                id: uuidv4(),
                username,
                email,
                passwordHash: hashedPassword,
                paperBalance: 1000.00,
            },
            select: {
                id: true,
                username: true,
                email: true,
                paperBalance: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                avatarUrl: true,
                isAdmin: true,
            },
        })

        return user
    }

    async updateProfile(userId: string, data: z.infer<typeof updateUserSchema>) {
        const validData = updateUserSchema.parse(data)

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: validData,
            select: {
                id: true,
                username: true,
                email: true,
                paperBalance: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                avatarUrl: true,
                isAdmin: true,
            },
        })

        return user
    }

    async updateLastLogin(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        })
    }

    async getLeaderboard() {
        // Get users with their P&L and trade count
        const users: any[] = await this.prisma.$queryRaw`
            SELECT
                u.id,
                u.username,
                u.email,
                u.paper_balance as "paperBalance",
                u."createdAt",
                u."avatarUrl",
                u."isAdmin",
                COUNT(t.id) as "totalTrades",
                ROUND(
                    (u.paper_balance + COALESCE(SUM(
                        CASE
                            WHEN p.side = 'YES' THEN p.shares * (1 - p."avgPrice")
                            ELSE p.shares * p."avgPrice"
                        END
                    ) - u.paper_balance), 2)
                ) as pnl
            FROM users u
            LEFT JOIN trades t ON t."userId" = u.id
            LEFT JOIN positions p ON p."userId" = u.id
            GROUP BY u.id
            ORDER BY pnl DESC
            LIMIT 50
        `

        return users.map((u: any, index: number) => ({
            rank: index + 1,
            user: {
                id: u.id,
                username: u.username,
                email: u.email,
                paperBalance: Number(u.paperBalance),
                createdAt: u.createdAt,
                updatedAt: u.createdAt,
                lastLoginAt: null,
                avatarUrl: u.avatarUrl,
                isAdmin: u.isAdmin,
            },
            pnl: Number(u.pnl),
            totalTrades: Number(u.totalTrades),
        }))
    }

    async getPublicProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                paperBalance: true,
                createdAt: true,
                avatarUrl: true,
                isAdmin: true,
            },
        })

        if (!user) {
            throw new NotFoundError('User not found')
        }

        const tradeCount = await this.prisma.trade.count({
            where: { userId },
        })

        return {
            ...user,
            paperBalance: Number(user.paperBalance),
            totalTrades: tradeCount,
        }
    }
}
