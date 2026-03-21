import { useState, useEffect } from 'react'
import { apiClient, LeaderboardEntry } from '../lib/api'

const RANK_COLORS = ['text-yellow-400', 'text-slate-300', 'text-orange-400']

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setIsLoading(true)
        apiClient.getLeaderboard()
            .then(data => { setLeaderboard(data); setError(null) })
            .catch(() => setError('Failed to load leaderboard'))
            .finally(() => setIsLoading(false))
    }, [])

    return (
        <div className="min-h-screen bg-pm-bg">
            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <h1 className="text-xl font-bold text-pm-text mb-6">Leaderboard</h1>

                {error && (
                    <div className="bg-red-950 border border-pm-no/30 text-pm-no px-3 py-2.5 rounded-lg mb-6 text-xs">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-5 h-5 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-20 text-pm-muted text-sm">No traders yet</div>
                ) : (
                    <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-12 px-4 py-2.5 border-b border-pm-border text-xs font-medium text-pm-subtle uppercase tracking-wider">
                            <div className="col-span-1">Rank</div>
                            <div className="col-span-4">Trader</div>
                            <div className="col-span-3 text-right">P&amp;L</div>
                            <div className="col-span-2 text-right">Trades</div>
                            <div className="col-span-2 text-right">Balance</div>
                        </div>

                        {leaderboard.map((entry, index) => (
                            <div
                                key={entry.user.id}
                                className={`grid grid-cols-12 px-4 py-3.5 items-center border-b border-pm-border last:border-0 hover:bg-pm-hover transition-colors ${
                                    index < 3 ? 'bg-pm-surface' : ''
                                }`}
                            >
                                {/* Rank */}
                                <div className="col-span-1">
                                    <span className={`font-tabular font-bold text-sm ${RANK_COLORS[index] ?? 'text-pm-muted'}`}>
                                        #{entry.rank}
                                    </span>
                                </div>

                                {/* Trader */}
                                <div className="col-span-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                            index === 0 ? 'bg-yellow-900 text-yellow-400' :
                                            index === 1 ? 'bg-slate-700 text-slate-300' :
                                            index === 2 ? 'bg-orange-900 text-orange-400' :
                                            'bg-pm-surface text-pm-muted'
                                        }`}>
                                            {entry.user.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-pm-text">{entry.user.username}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* P&L */}
                                <div className="col-span-3 text-right">
                                    <span className={`font-tabular text-sm font-semibold ${entry.pnl >= 0 ? 'text-pm-yes' : 'text-pm-no'}`}>
                                        {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
                                    </span>
                                </div>

                                {/* Trades */}
                                <div className="col-span-2 text-right">
                                    <span className="font-tabular text-sm text-pm-muted">{entry.totalTrades}</span>
                                </div>

                                {/* Balance */}
                                <div className="col-span-2 text-right">
                                    <span className="font-tabular text-sm font-semibold text-pm-text">
                                        ${entry.user.paperBalance.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
