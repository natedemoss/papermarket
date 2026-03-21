import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/store'
import { apiClient } from '../lib/api'
import Logo from '../components/Logo'

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
                        <Logo size={32} />
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

                    {/* Google sign-in */}
                    <a
                        href={`${(import.meta.env.VITE_API_URL ?? '/api').replace(/\/api$/, '')}/api/auth/google`}
                        className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-pm-surface border border-pm-border hover:border-pm-subtle rounded-lg text-sm font-medium text-pm-text transition-colors mb-4"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </a>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-pm-border" />
                        <span className="text-pm-subtle text-xs">or</span>
                        <div className="flex-1 h-px bg-pm-border" />
                    </div>

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
