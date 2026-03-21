import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/store'
import { apiClient } from '../lib/api'

export default function Header() {
    const { user, clearAuth } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = async () => {
        try {
            await apiClient.logout()
            clearAuth()
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            navigate('/')
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-900">PaperMarket</span>
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden md:flex gap-8">
                        <Link
                            to="/markets"
                            className={`font-medium transition pb-1 border-b-2 ${
                                isActive('/markets')
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            }`}
                        >
                            Markets
                        </Link>
                        <Link
                            to="/leaderboard"
                            className={`font-medium transition pb-1 border-b-2 ${
                                isActive('/leaderboard')
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            }`}
                        >
                            Leaderboard
                        </Link>
                        {user && (
                            <Link
                                to="/portfolio"
                                className={`font-medium transition pb-1 border-b-2 ${
                                    isActive('/portfolio')
                                        ? 'text-blue-600 border-blue-600'
                                        : 'text-gray-600 border-transparent hover:text-gray-900'
                                }`}
                            >
                                Portfolio
                            </Link>
                        )}
                    </nav>

                    {/* User Section */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm text-gray-600">{user.username}</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        ${user.paperBalance.toFixed(2)}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded transition"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded transition"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
