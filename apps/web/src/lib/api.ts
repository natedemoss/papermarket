import axios, { AxiosInstance, AxiosError } from 'axios'

interface AuthToken {
    accessToken: string
    refreshToken: string
}

interface User {
    id: string
    username: string
    email: string
    paperBalance: number
    createdAt: string
    updatedAt: string
    lastLoginAt: string | null
    avatarUrl: string | null
    isAdmin: boolean
}

interface Market {
    id: string
    title: string
    category: string
    yesProb: number
    volume: number
    closesAt: string | null
    resolvedAt: string | null
    resolvedYes: boolean | null
    createdById: string
    createdAt: string
    polymarketId: string | null
    polymarketSynced: boolean
    imageUrl: string | null
    description: string | null
    outcomes: string | null
    clobTokenIds: string | null
}

interface Position {
    id: string
    userId: string
    marketId: string
    side: 'YES' | 'NO'
    shares: number
    avgPrice: number
    costBasis: number
    createdAt: string
    updatedAt: string
    market?: Market
}

interface Trade {
    id: string
    userId: string
    marketId: string
    side: 'YES' | 'NO'
    shares: number
    price: number
    amount: number
    type: 'BUY' | 'SELL' | 'PAYOUT'
    createdAt: string
    market?: Market
}

interface Comment {
    id: string
    userId: string
    marketId: string
    content: string
    createdAt: string
    updatedAt: string
    user: { id: string; username: string; avatarUrl: string | null }
}

interface LeaderboardEntry {
    rank: number
    user: User
    pnl: number
    totalTrades: number
}

class ApiClient {
    private axiosInstance: AxiosInstance
    private baseURL: string

    constructor(baseURL: string = '/api') {
        this.baseURL = baseURL

        this.axiosInstance = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // Add token to requests
        this.axiosInstance.interceptors.request.use((config) => {
            const token = localStorage.getItem('accessToken')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        })

        // Handle 401 errors and try to refresh token
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true
                    try {
                        const refreshToken = localStorage.getItem('refreshToken')
                        if (refreshToken) {
                            const response = await axios.post(`${this.baseURL}/auth/refresh`, {
                                refreshToken,
                            })
                            const { accessToken } = response.data
                            localStorage.setItem('accessToken', accessToken)
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`
                            return this.axiosInstance(originalRequest)
                        }
                    } catch {
                        // Refresh failed, clear auth
                        localStorage.removeItem('accessToken')
                        localStorage.removeItem('refreshToken')
                        window.location.href = '/login'
                    }
                }
                throw error
            }
        )
    }

    // Auth endpoints
    async register(username: string, email: string, password: string) {
        const response = await this.axiosInstance.post('/auth/register', {
            username,
            email,
            password,
        })
        return response.data as { user: User; accessToken: string; refreshToken: string }
    }

    async login(email: string, password: string) {
        const response = await this.axiosInstance.post('/auth/login', {
            email,
            password,
        })
        return response.data as { user: User; accessToken: string; refreshToken: string }
    }

    async logout() {
        await this.axiosInstance.post('/auth/logout')
    }

    async getMe() {
        const response = await this.axiosInstance.get('/auth/me')
        return response.data as User
    }

    // User endpoints
    async getLeaderboard() {
        const response = await this.axiosInstance.get('/users/leaderboard')
        return response.data as LeaderboardEntry[]
    }

    async getUserProfile(userId: string) {
        const response = await this.axiosInstance.get(`/users/${userId}`)
        return response.data as User & { totalTrades: number }
    }

    async updateProfile(username?: string, avatarUrl?: string | null) {
        const response = await this.axiosInstance.patch('/users/me', {
            ...(username && { username }),
            ...(avatarUrl !== undefined && { avatarUrl }),
        })
        return response.data as User
    }

    // Market endpoints
    async getMarkets(category?: string, sort?: 'volume' | 'newest' | 'closing_soon', resolved?: boolean) {
        const params = new URLSearchParams()
        if (category) params.append('category', category)
        if (sort) params.append('sort', sort)
        if (resolved) params.append('resolved', 'true')

        const response = await this.axiosInstance.get(`/markets?${params.toString()}`)
        return response.data as Market[]
    }

    async getMarket(marketId: string) {
        const response = await this.axiosInstance.get(`/markets/${marketId}`)
        return response.data as Market
    }

    async createMarket(title: string, category: string, yesProb: number, closesAt: string) {
        const response = await this.axiosInstance.post('/markets', {
            title,
            category,
            yesProb,
            closesAt,
        })
        return response.data as Market
    }

    async resolveMarket(marketId: string, outcome: boolean) {
        const response = await this.axiosInstance.post(`/markets/${marketId}/resolve`, {
            outcome,
        })
        return response.data as Market
    }

    // Trade endpoints
    async placeTrade(marketId: string, side: 'YES' | 'NO', amount: number) {
        const response = await this.axiosInstance.post('/trades', {
            marketId,
            side,
            amount,
        })
        return response.data as {
            trade: Trade
            position: Position
            userBalance: number
        }
    }

    async getMyTrades(page: number = 1, limit: number = 50) {
        const response = await this.axiosInstance.get(`/trades/me?page=${page}&limit=${limit}`)
        return response.data as {
            trades: Trade[]
            pagination: { page: number; limit: number; total: number; totalPages: number }
        }
    }

    // Position endpoints
    async getMyPositions() {
        const response = await this.axiosInstance.get('/positions/me')
        return response.data as Position[]
    }

    // Comment endpoints
    async getPriceHistory(marketId: string, interval: string) {
        const response = await this.axiosInstance.get(`/markets/${marketId}/prices-history?interval=${interval}`)
        return response.data as { history: { t: number; p: number }[] }
    }

    async getComments(marketId: string) {
        const response = await this.axiosInstance.get(`/markets/${marketId}/comments`)
        return response.data as Comment[]
    }

    async postComment(marketId: string, content: string) {
        const response = await this.axiosInstance.post(`/markets/${marketId}/comments`, { content })
        return response.data as Comment
    }

    async deleteComment(marketId: string, commentId: string) {
        await this.axiosInstance.delete(`/markets/${marketId}/comments/${commentId}`)
    }

    // Admin endpoints
    async syncPolymarket() {
        const response = await this.axiosInstance.post('/admin/sync')
        return response.data as { synced: number; errors: string[] }
    }

    async getAdminUsers() {
        const response = await this.axiosInstance.get('/admin/users')
        return response.data as (User & { totalTrades: number })[]
    }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_URL || '/api')

export type {
    User,
    Market,
    Position,
    Trade,
    Comment,
    LeaderboardEntry,
    AuthToken,
}
