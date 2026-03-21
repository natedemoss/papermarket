import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient, Position, Trade } from '../lib/api'
import { usePositions, useTrades } from '../lib/store'

export default function PortfolioPage() {
    const { positions, setPositions: setPosState, isLoading: posLoading } = usePositions()
    const { trades, setTrades: setTradesState, isLoading: tradesLoading } = useTrades()
    const [activeTab, setActiveTab] = useState<'positions' | 'trades'>('positions')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [posData, tradeData] = await Promise.all([
                    apiClient.getMyPositions(),
                    apiClient.getMyTrades(),
                ])
                setPosState(posData)
                setTradesState(tradeData.trades)
            } catch {
                setError('Failed to load portfolio')
            }
        }
        fetchData()
    }, [setPosState, setTradesState])

    const totalPositionValue = positions.reduce((sum, pos) => {
        if (pos.market) {
            const value = pos.side === 'YES'
                ? pos.shares * (pos.market.yesProb / 100)
                : pos.shares * ((100 - pos.market.yesProb) / 100)
            return sum + value
        }
        return sum
    }, 0)

    return (
        <div className="min-h-screen bg-pm-bg">
            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <h1 className="text-xl font-bold text-pm-text mb-6">Portfolio</h1>

                {error && (
                    <div className="bg-red-950 border border-pm-no/30 text-pm-no px-3 py-2.5 rounded-lg mb-4 text-xs mb-6">
                        {error}
                    </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: 'Position Value', value: `$${totalPositionValue.toFixed(2)}` },
                        { label: 'Open Positions', value: positions.length.toString() },
                        { label: 'Total Trades', value: trades.length.toString() },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-pm-card border border-pm-border rounded-xl p-4">
                            <p className="text-pm-muted text-xs mb-1">{label}</p>
                            <p className="font-tabular text-xl font-bold text-pm-text">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 border-b border-pm-border">
                    {(['positions', 'trades'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                                activeTab === tab
                                    ? 'border-pm-blue text-pm-text'
                                    : 'border-transparent text-pm-muted hover:text-pm-text'
                            }`}
                        >
                            {tab === 'positions' ? 'Positions' : 'Trade History'}
                        </button>
                    ))}
                </div>

                {/* Positions */}
                {activeTab === 'positions' && (
                    posLoading ? (
                        <div className="text-center py-16">
                            <div className="inline-block w-5 h-5 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
                        </div>
                    ) : positions.length === 0 ? (
                        <div className="text-center py-16 text-pm-muted text-sm">
                            <p className="mb-3">No open positions</p>
                            <Link to="/markets" className="text-pm-blue hover:underline text-xs">Browse markets</Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {positions.map((pos: Position) => {
                                const currentValue = pos.side === 'YES'
                                    ? pos.shares * (pos.market?.yesProb ?? 50) / 100
                                    : pos.shares * (100 - (pos.market?.yesProb ?? 50)) / 100
                                const pnl = currentValue - pos.costBasis
                                return (
                                    <div key={pos.id} className="bg-pm-card border border-pm-border rounded-xl p-4 flex items-center gap-4">
                                        {/* Side indicator */}
                                        <div className={`w-1 self-stretch rounded-full ${pos.side === 'YES' ? 'bg-pm-yes' : 'bg-pm-no'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-pm-text line-clamp-1">
                                                {pos.market?.title || 'Unknown Market'}
                                            </p>
                                            <p className="font-tabular text-xs text-pm-muted mt-1">
                                                <span className={pos.side === 'YES' ? 'text-pm-yes' : 'text-pm-no'}>{pos.side}</span>
                                                {' · '}{pos.shares.toFixed(2)} shares
                                                {' · '}avg {pos.avgPrice.toFixed(2)}¢
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-tabular text-sm font-semibold text-pm-text">${currentValue.toFixed(2)}</p>
                                            <p className={`font-tabular text-xs mt-0.5 ${pnl >= 0 ? 'text-pm-yes' : 'text-pm-no'}`}>
                                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}

                {/* Trades */}
                {activeTab === 'trades' && (
                    tradesLoading ? (
                        <div className="text-center py-16">
                            <div className="inline-block w-5 h-5 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
                        </div>
                    ) : trades.length === 0 ? (
                        <div className="text-center py-16 text-pm-muted text-sm">No trades yet</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {trades.map((trade: Trade) => (
                                <div key={trade.id} className="bg-pm-card border border-pm-border rounded-xl px-4 py-3 flex items-center gap-4">
                                    <div className={`w-1 self-stretch rounded-full ${trade.side === 'YES' ? 'bg-pm-yes' : 'bg-pm-no'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-pm-text line-clamp-1">
                                            {trade.market?.title || 'Unknown Market'}
                                        </p>
                                        <p className="font-tabular text-xs text-pm-muted mt-0.5">
                                            <span className={trade.side === 'YES' ? 'text-pm-yes' : 'text-pm-no'}>{trade.side}</span>
                                            {' · '}{trade.shares.toFixed(2)} shares @ {trade.price.toFixed(2)}¢
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-tabular text-sm font-semibold text-pm-text">${trade.amount.toFixed(2)}</p>
                                        <p className="font-tabular text-xs text-pm-subtle mt-0.5">
                                            {new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
