import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { UnauthorizedError, NotFoundError } from '../middleware/errorHandler'
import { loginSchema, registerSchema } from '../types/schemas'
import { UserService } from './users'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

export class AuthService {
    constructor(private prisma: PrismaClient, private userService: UserService) {}

    async register(data: z.infer<typeof registerSchema>) {
        const user = await this.userService.create(data)

        const accessToken = this.generateAccessToken(user)
        const refreshToken = this.generateRefreshToken(user)

        await this.storeRefreshToken(user.id, refreshToken)

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                paperBalance: Number(user.paperBalance),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt,
                avatarUrl: user.avatarUrl,
                isAdmin: user.isAdmin,
            },
            accessToken,
            refreshToken,
        }
    }

    async login(data: z.infer<typeof loginSchema>) {
        const { email, password } = loginSchema.parse(data)

        const user = await this.userService.findByEmail(email)
        if (!user) {
            throw new UnauthorizedError('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials')
        }

        await this.userService.updateLastLogin(user.id)

        const accessToken = this.generateAccessToken(user)
        const refreshToken = this.generateRefreshToken(user)

        await this.storeRefreshToken(user.id, refreshToken)

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                paperBalance: Number(user.paperBalance),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt,
                avatarUrl: user.avatarUrl,
                isAdmin: user.isAdmin,
            },
            accessToken,
            refreshToken,
        }
    }

    async refresh(refreshToken: string) {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string }

        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { userId: decoded.userId },
        })

        if (!storedToken || storedToken.token !== this.hashToken(refreshToken)) {
            throw new UnauthorizedError('Invalid refresh token')
        }

        const user = await this.userService.findById(decoded.userId)
        if (!user) {
            throw new NotFoundError('User not found')
        }

        const newAccessToken = this.generateAccessToken(user)

        return { accessToken: newAccessToken }
    }

    async logout(userId: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        })
    }

    async invalidateRefreshToken(userId: string, refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                token: this.hashToken(refreshToken),
            },
        })
    }

    private generateAccessToken(user: any) {
        return jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            },
            process.env.JWT_SECRET!,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        )
    }

    private generateRefreshToken(user: any) {
        return jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        )
    }

    private hashToken(token: string) {
        return require('crypto').createHash('sha256').update(token).digest('hex')
    }

    private async storeRefreshToken(userId: string, token: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        })

        await this.prisma.refreshToken.create({
            data: {
                id: uuidv4(),
                userId,
                token: this.hashToken(token),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        })
    }
}
