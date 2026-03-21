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
                googleId: null,
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
        // Fetch all users with their positions (and market probs) and trade counts
        const users = await this.prisma.user.findMany({
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
                positions: {
                    where: { market: { resolvedAt: null } },
                    select: {
                        shares: true,
                        side: true,
                        costBasis: true,
                        market: { select: { yesProb: true } },
                    },
                },
                _count: { select: { trades: true } },
            },
        })

        const ranked = users.map(u => {
            const cash = Number(u.paperBalance)

            // Unrealized value of open positions at current market price
            const positionValue = u.positions.reduce((sum, p) => {
                const price = p.side === 'YES'
                    ? p.market.yesProb / 100
                    : (100 - p.market.yesProb) / 100
                return sum + Number(p.shares) * price
            }, 0)

            // P&L = (cash + open position value) - starting balance (1000)
            const pnl = Math.round((cash + positionValue - 1000) * 100) / 100

            return {
                user: {
                    id: u.id,
                    username: u.username,
                    email: u.email,
                    paperBalance: cash,
                    createdAt: u.createdAt,
                    updatedAt: u.updatedAt,
                    lastLoginAt: u.lastLoginAt,
                    avatarUrl: u.avatarUrl,
                    isAdmin: u.isAdmin,
                },
                pnl,
                totalTrades: u._count.trades,
            }
        })

        return ranked
            .sort((a, b) => b.pnl - a.pnl)
            .slice(0, 50)
            .map((entry, index) => ({ ...entry, rank: index + 1 }))
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
