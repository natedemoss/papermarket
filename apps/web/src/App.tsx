import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './lib/store'
import { apiClient } from './lib/api'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MarketsPage from './pages/MarketsPage'
import MarketDetailPage from './pages/MarketDetailPage'
import PortfolioPage from './pages/PortfolioPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import InfoPage from './pages/InfoPage'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
    const { accessToken, setUser, setLoading } = useAuth()

    useEffect(() => {
        if (accessToken) {
            setLoading(true)
            apiClient.getMe()
                .then(user => setUser(user))
                .catch(() => {
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                })
                .finally(() => setLoading(false))
        }
    }, [accessToken, setUser, setLoading])

    return (
        <BrowserRouter>
          <ErrorBoundary>
            <div className="min-h-screen bg-pm-bg text-pm-text">
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                        <Route path="/markets" element={<MarketsPage />} />
                        <Route path="/markets/:id" element={<MarketDetailPage />} />
                        <Route
                            path="/portfolio"
                            element={
                                <ProtectedRoute>
                                    <PortfolioPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute>
                                    <AdminUsersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/info" element={<InfoPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
          </ErrorBoundary>
        </BrowserRouter>
    )
}
