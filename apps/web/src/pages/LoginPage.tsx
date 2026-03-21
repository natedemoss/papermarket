import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/store'
import { apiClient } from '../lib/api'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { setUser, setTokens } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            const result = await apiClient.login(email, password)
            setUser(result.user)
            setTokens(result.accessToken, result.refreshToken)
            localStorage.setItem('accessToken', result.accessToken)
            localStorage.setItem('refreshToken', result.refreshToken)
            navigate('/markets')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-pm-bg flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-pm-blue rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">P</span>
                        </div>
                        <span className="font-semibold text-pm-text">PaperMarket</span>
                    </Link>
                </div>

                <div className="bg-pm-card border border-pm-border rounded-2xl p-6">
                    <h1 className="text-xl font-bold text-pm-text mb-1">Sign in</h1>
                    <p className="text-pm-muted text-sm mb-6">Welcome back</p>

                    {error && (
                        <div className="bg-red-950 border border-pm-no/30 text-pm-no px-3 py-2.5 rounded-lg mb-4 text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-pm-muted mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 bg-pm-surface border border-pm-border rounded-lg text-pm-text text-sm focus:outline-none focus:border-pm-blue transition-colors placeholder-pm-subtle"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-pm-muted mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 bg-pm-surface border border-pm-border rounded-lg text-pm-text text-sm focus:outline-none focus:border-pm-blue transition-colors placeholder-pm-subtle"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 bg-pm-blue hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors mt-2"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-pm-muted text-sm mt-4">
                    No account?{' '}
                    <Link to="/register" className="text-pm-blue hover:underline font-medium">
                        Sign up free
                    </Link>
                </p>
            </div>
        </div>
    )
}
