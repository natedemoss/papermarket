import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/store'
import { apiClient } from '../lib/api'

export default function RegisterPage() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { setUser, setTokens } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setIsLoading(true)

        try {
            const result = await apiClient.register(username, email, password)
            setUser(result.user)
            setTokens(result.accessToken, result.refreshToken)
            localStorage.setItem('accessToken', result.accessToken)
            localStorage.setItem('refreshToken', result.refreshToken)
            navigate('/markets')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Create Account</h1>
                <p className="text-gray-600 text-center mb-8">Start trading prediction markets</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            maxLength={20}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="trader123"
                        />
                    </div>

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
                            minLength={8}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
