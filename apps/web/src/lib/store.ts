import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Market, Position, Trade } from './api'

interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isLoading: boolean
    error: string | null

    setUser: (user: User | null) => void
    setTokens: (accessToken: string, refreshToken: string) => void
    clearAuth: () => void
    setError: (error: string | null) => void
    setLoading: (isLoading: boolean) => void
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,

            setUser: (user) => set({ user }),
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
            clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
            setError: (error) => set({ error }),
            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
        }
    )
)

interface MarketState {
    markets: Market[]
    selectedMarket: Market | null
    isLoading: boolean
    error: string | null

    setMarkets: (markets: Market[]) => void
    setSelectedMarket: (market: Market | null) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
}

export const useMarkets = create<MarketState>((set) => ({
    markets: [],
    selectedMarket: null,
    isLoading: false,
    error: null,

    setMarkets: (markets) => set({ markets }),
    setSelectedMarket: (market) => set({ selectedMarket: market }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}))

interface PositionState {
    positions: Position[]
    isLoading: boolean
    error: string | null

    setPositions: (positions: Position[]) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
}

export const usePositions = create<PositionState>((set) => ({
    positions: [],
    isLoading: false,
    error: null,

    setPositions: (positions) => set({ positions }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}))

interface TradeState {
    trades: Trade[]
    isLoading: boolean
    error: string | null

    setTrades: (trades: Trade[]) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
}

export const useTrades = create<TradeState>((set) => ({
    trades: [],
    isLoading: false,
    error: null,

    setTrades: (trades) => set({ trades }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}))
