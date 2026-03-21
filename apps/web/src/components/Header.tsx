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
        ...(user?.isAdmin ? [{ label: 'Admin', path: '/admin/users' }] : []),
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

                    {/* GitHub badge */}
                    <a
                        href="https://github.com/natedemoss/papermarket"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-pm-border hover:border-pm-subtle bg-pm-card hover:bg-pm-hover text-pm-muted hover:text-pm-text transition-all text-xs font-medium shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        Open Source
                    </a>

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
