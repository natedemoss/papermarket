import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

export function getGoogleAuthUrl(callbackUrl: string): string {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function handleGoogleCallback(
    code: string,
    callbackUrl: string,
    prisma: PrismaClient
) {
    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            redirect_uri: callbackUrl,
            grant_type: 'authorization_code',
        }).toString(),
    })

    if (!tokenRes.ok) {
        throw new Error('Failed to exchange Google code for token')
    }

    const tokenData = await tokenRes.json() as { access_token: string }

    // Get user profile
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!profileRes.ok) {
        throw new Error('Failed to fetch Google user profile')
    }

    const profile = await profileRes.json() as {
        id: string
        email: string
        name: string
        picture: string
    }

    // Find or create user
    let user = await prisma.user.findFirst({
        where: { OR: [{ googleId: profile.id }, { email: profile.email }] },
    })

    if (user) {
        if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, lastLoginAt: new Date() },
            })
        } else {
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            })
        }
    } else {
        const baseUsername = (profile.name ?? profile.email.split('@')[0])
            .replace(/[^a-zA-Z0-9_]/g, '')
            .slice(0, 18) || 'user'

        let username = baseUsername
        const existing = await prisma.user.findUnique({ where: { username } })
        if (existing) username = username.slice(0, 14) + Math.floor(Math.random() * 9000 + 1000)

        user = await prisma.user.create({
            data: {
                id: uuidv4(),
                username,
                email: profile.email,
                googleId: profile.id,
                passwordHash: null,
                avatarUrl: profile.picture ?? null,
                paperBalance: 1000.00,
            },
        })
    }

    return user
}
