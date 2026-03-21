import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/store'
import { apiClient } from '../lib/api'
import Logo from './Logo'

export default function Header() {
    const { user, clearAuth } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/markets?q=${encodeURIComponent(searchQuery.trim())}`)
            setSearchOpen(false)
        }
    }

    const handleLogout = async () => {
        try {
            await apiClient.logout()
        } catch (_) {}
        clearAuth()
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/')
    }

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + '/')

    const navLinks = [
        { label: 'Markets', path: '/markets' },
        { label: 'Leaderboard', path: '/leaderboard' },
        { label: 'Info', path: '/info' },
        ...(user ? [{ label: 'Portfolio', path: '/portfolio' }] : []),
        ...(user?.isAdmin ? [{ label: 'Users', path: '/admin/users' }] : []),
    ]

    return (
        <>
            <header className="bg-pm-surface border-b border-pm-border sticky top-0 z-50">
                <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <Logo size={28} />
                        <span className="font-semibold text-pm-text text-sm tracking-tight">PaperMarket</span>
                    </Link>

                    {/* Nav */}
                    <nav className="hidden md:flex items-center gap-1 ml-2">
                        {navLinks.map(({ label, path }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    isActive(path)
                                        ? 'bg-pm-card text-pm-text'
                                        : 'text-pm-muted hover:text-pm-text hover:bg-pm-hover'
                                }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto hidden md:block">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pm-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search markets..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-pm-card border border-pm-border rounded-md text-sm text-pm-text placeholder-pm-subtle focus:outline-none focus:border-pm-blue transition-colors"
                            />
                        </div>
                    </form>

                    {/* Right section */}
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        {/* Mobile search toggle */}
                        <button
                            className="md:hidden p-1.5 text-pm-muted hover:text-pm-text"
                            onClick={() => setSearchOpen(!searchOpen)}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        {user ? (
                            <>
                                <div className="hidden sm:flex items-center gap-2 bg-pm-card border border-pm-border rounded-md px-3 py-1.5">
                                    <span className="font-tabular text-sm font-medium text-pm-yes">
                                        ${Number(user.paperBalance).toFixed(2)}
                                    </span>
                                    <span className="text-pm-subtle text-xs">|</span>
                                    <span className="text-pm-muted text-xs">{user.username}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-1.5 text-sm text-pm-muted hover:text-pm-text border border-pm-border rounded-md hover:border-pm-subtle transition-colors"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-3 py-1.5 text-sm text-pm-muted hover:text-pm-text transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-3 py-1.5 text-sm font-medium bg-pm-blue hover:bg-blue-600 text-white rounded-md transition-colors"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile search bar */}
                {searchOpen && (
                    <div className="md:hidden px-4 pb-3 border-t border-pm-border pt-3">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pm-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search markets..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="w-full pl-8 pr-3 py-2 bg-pm-card border border-pm-border rounded-md text-sm text-pm-text placeholder-pm-subtle focus:outline-none focus:border-pm-blue"
                                />
                            </div>
                        </form>
                    </div>
                )}
            </header>
        </>
    )
}
