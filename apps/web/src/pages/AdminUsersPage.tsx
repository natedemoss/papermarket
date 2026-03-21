import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, User } from '../lib/api'
import { useAuth } from '../lib/store'

type AdminUser = User & { totalTrades: number }

export default function AdminUsersPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!user?.isAdmin) { navigate('/'); return }
        apiClient.getAdminUsers()
            .then(data => { setUsers(data); setError(null) })
            .catch(() => setError('Failed to load users'))
            .finally(() => setIsLoading(false))
    }, [user, navigate])

    const filtered = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )

    const totalBalance = users.reduce((s, u) => s + u.paperBalance, 0)
    const totalTrades = users.reduce((s, u) => s + u.totalTrades, 0)

    return (
        <div className="min-h-screen bg-pm-bg">
            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-pm-text">Users</h1>
                        <p className="text-pm-muted text-xs mt-0.5">Admin panel</p>
                    </div>
                    <div className="flex gap-4 text-right">
                        <div>
                            <p className="font-tabular text-sm font-semibold text-pm-text">{users.length}</p>
                            <p className="text-2xs text-pm-muted uppercase tracking-wider">Total Users</p>
                        </div>
                        <div>
                            <p className="font-tabular text-sm font-semibold text-pm-yes">${totalBalance.toFixed(0)}</p>
                            <p className="text-2xs text-pm-muted uppercase tracking-wider">Total Balance</p>
                        </div>
                        <div>
                            <p className="font-tabular text-sm font-semibold text-pm-text">{totalTrades}</p>
                            <p className="text-2xs text-pm-muted uppercase tracking-wider">Total Trades</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full max-w-sm px-3 py-2 bg-pm-card border border-pm-border rounded-lg text-sm text-pm-text placeholder-pm-subtle focus:outline-none focus:border-pm-blue transition-colors"
                    />
                </div>

                {error && (
                    <div className="bg-red-950 border border-pm-no/30 text-pm-no px-3 py-2.5 rounded-lg mb-4 text-xs">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-5 h-5 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-12 px-4 py-2.5 border-b border-pm-border text-xs font-medium text-pm-subtle uppercase tracking-wider">
                            <div className="col-span-3">Username</div>
                            <div className="col-span-4">Email</div>
                            <div className="col-span-2 text-right">Balance</div>
                            <div className="col-span-1 text-right">Trades</div>
                            <div className="col-span-1 text-center">Role</div>
                            <div className="col-span-1 text-right">Joined</div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-pm-muted text-sm">No users found</div>
                        ) : (
                            filtered.map((u) => (
                                <div
                                    key={u.id}
                                    className="grid grid-cols-12 px-4 py-3 items-center border-b border-pm-border last:border-0 hover:bg-pm-hover transition-colors"
                                >
                                    {/* Username */}
                                    <div className="col-span-3 flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                            u.isAdmin ? 'bg-blue-900 text-pm-blue' : 'bg-pm-surface text-pm-muted'
                                        }`}>
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-pm-text truncate">{u.username}</span>
                                    </div>

                                    {/* Email */}
                                    <div className="col-span-4">
                                        <span className="text-sm text-pm-muted truncate">{u.email}</span>
                                    </div>

                                    {/* Balance */}
                                    <div className="col-span-2 text-right">
                                        <span className="font-tabular text-sm text-pm-yes">${u.paperBalance.toFixed(2)}</span>
                                    </div>

                                    {/* Trades */}
                                    <div className="col-span-1 text-right">
                                        <span className="font-tabular text-sm text-pm-muted">{u.totalTrades}</span>
                                    </div>

                                    {/* Role */}
                                    <div className="col-span-1 text-center">
                                        {u.isAdmin ? (
                                            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-blue-950 text-pm-blue uppercase">Admin</span>
                                        ) : (
                                            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-pm-surface text-pm-subtle uppercase">User</span>
                                        )}
                                    </div>

                                    {/* Joined */}
                                    <div className="col-span-1 text-right">
                                        <span className="font-tabular text-xs text-pm-subtle">
                                            {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
