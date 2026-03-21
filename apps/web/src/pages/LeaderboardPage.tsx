import { useState, useEffect } from 'react'
import { apiClient, LeaderboardEntry } from '../lib/api'

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true)
            try {
                const data = await apiClient.getLeaderboard()
                setLeaderboard(data)
                setError(null)
            } catch (err) {
                setError('Failed to load leaderboard')
            } finally {
                setIsLoading(false)
            }
        }
        fetchLeaderboard()
    }, [])

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-4xl font-bold text-white mb-8">Global Leaderboard</h1>

            {error && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-12">
                    <p className="text-slate-400">Loading leaderboard...</p>
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-400">No traders yet</p>
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-700 border-b border-slate-600">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rank</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Trader</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">P&L</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">Trades</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((entry, index) => (
                                    <tr
                                        key={entry.user.id}
                                        className={`border-b border-slate-600 ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'
                                            } hover:bg-slate-700 transition`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {entry.rank <= 3 && (
                                                    <span className="text-lg">
                                                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                                                    </span>
                                                )}
                                                <span className="font-semibold text-white">#{entry.rank}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-white">{entry.user.username}</p>
                                                <p className="text-sm text-slate-400">{entry.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className={`font-semibold ${entry.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {entry.pnl >= 0 ? '+' : ''} ${entry.pnl.toFixed(2)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-white">{entry.totalTrades}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-semibold text-white">
                                                ${entry.user.paperBalance.toFixed(2)}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
