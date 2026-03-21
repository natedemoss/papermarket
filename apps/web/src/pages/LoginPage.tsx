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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Sign In</h1>
                <p className="text-gray-600 text-center mb-8">Trade prediction markets with play money</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}
