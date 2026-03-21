import { useState, useEffect } from 'react'
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
            } catch (err) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-4xl font-bold text-white mb-8">Portfolio</h1>

            {error && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Portfolio Summary */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-slate-400 text-sm mb-1">Open Positions Value</p>
                        <p className="text-3xl font-bold text-white">${totalPositionValue.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm mb-1">Total Positions</p>
                        <p className="text-3xl font-bold text-white">{positions.length}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm mb-1">Total Trades</p>
                        <p className="text-3xl font-bold text-white">{trades.length}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('positions')}
                    className={`px-4 py-2 font-semibold transition ${activeTab === 'positions'
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Positions
                </button>
                <button
                    onClick={() => setActiveTab('trades')}
                    className={`px-4 py-2 font-semibold transition ${activeTab === 'trades'
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Trade History
                </button>
            </div>

            {/* Positions Tab */}
            {activeTab === 'positions' && (
                <div>
                    {posLoading ? (
                        <p className="text-slate-400">Loading positions...</p>
                    ) : positions.length === 0 ? (
                        <p className="text-slate-400">No open positions</p>
                    ) : (
                        <div className="grid gap-4">
                            {positions.map((pos: Position) => (
                                <div
                                    key={pos.id}
                                    className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                {pos.market?.title || 'Unknown Market'}
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                {pos.side} - {pos.shares.toFixed(2)} shares
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-white">
                                                ${(pos.side === 'YES'
                                                    ? pos.shares * (pos.market?.yesProb ?? 50) / 100
                                                    : pos.shares * (100 - (pos.market?.yesProb ?? 50)) / 100
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        Avg Price: ${pos.avgPrice.toFixed(2)} | Cost: ${pos.costBasis.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Trades Tab */}
            {activeTab === 'trades' && (
                <div>
                    {tradesLoading ? (
                        <p className="text-slate-400">Loading trades...</p>
                    ) : trades.length === 0 ? (
                        <p className="text-slate-400">No trades yet</p>
                    ) : (
                        <div className="grid gap-2">
                            {trades.map((trade: Trade) => (
                                <div
                                    key={trade.id}
                                    className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="text-white font-semibold">
                                            {trade.market?.title || 'Unknown Market'}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            {trade.type} {trade.side} - {trade.shares.toFixed(2)} @ ${trade.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-semibold">${trade.amount.toFixed(2)}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(trade.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
