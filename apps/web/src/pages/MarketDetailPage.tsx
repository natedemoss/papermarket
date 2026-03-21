import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient, Market } from '../lib/api'
import { useAuth } from '../lib/store'

export default function MarketDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user, setUser } = useAuth()

    const [market, setMarket] = useState<Market | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [amount, setAmount] = useState('100')
    const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>('YES')
    const [isTrading, setIsTrading] = useState(false)

    useEffect(() => {
        if (id) {
            const fetchMarket = async () => {
                setIsLoading(true)
                try {
                    const data = await apiClient.getMarket(id)
                    setMarket(data)
                    setError(null)
                } catch (err) {
                    setError('Failed to load market')
                } finally {
                    setIsLoading(false)
                }
            }
            fetchMarket()
        }
    }, [id])

    const handleTrade = async () => {
        if (!user || !market || !id) return

        const tradeAmount = parseFloat(amount)
        if (isNaN(tradeAmount) || tradeAmount <= 0) {
            setError('Invalid amount')
            return
        }

        if (tradeAmount > user.paperBalance) {
            setError('Insufficient balance')
            return
        }

        setIsTrading(true)
        try {
            const result = await apiClient.placeTrade(id, selectedSide, tradeAmount)
            setMarket(prev => prev && result.position.market ? {
                ...prev,
                yesProb: result.position.market.yesProb,
                volume: result.position.market.volume,
            } : prev)
            setUser({ ...user, paperBalance: result.userBalance })
            setAmount('100')
            setError(null)
            alert(`Trade placed successfully!\nShares: ${result.position.shares.toFixed(2)}\nNew balance: $${result.userBalance.toFixed(2)}`)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Trade failed')
        } finally {
            setIsTrading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <p className="text-slate-400">Loading market...</p>
            </div>
        )
    }

    if (!market) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <p className="text-red-500">Market not found</p>
            </div>
        )
    }

    const yesPrice = market.yesProb / 100
    const noPrice = (100 - market.yesProb) / 100
    const selectedPrice = selectedSide === 'YES' ? yesPrice : noPrice
    const shares = amount ? parseFloat(amount) / selectedPrice : 0

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/markets')}
                className="text-blue-500 hover:text-blue-400 mb-4"
            >
                ← Back to Markets
            </button>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                {/* Market Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">{market.title}</h1>
                    <div className="flex gap-4 mb-4">
                        <span className="text-sm bg-slate-700 text-slate-300 px-3 py-1 rounded">
                            {market.category}
                        </span>
                        {market.polymarketSynced && (
                            <span className="text-sm bg-purple-700 text-purple-300 px-3 py-1 rounded">
                                Powered by Polymarket
                            </span>
                        )}
                    </div>

                    {market.description && (
                        <p className="text-slate-400 mb-4">{market.description}</p>
                    )}
                </div>

                {/* Market Stats */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Volume</p>
                        <p className="text-2xl font-bold text-white">${market.volume.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Closes</p>
                        <p className="text-2xl font-bold text-white">
                            {market.closesAt ? new Date(market.closesAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">Status</p>
                        <p className="text-2xl font-bold text-white">
                            {market.resolvedAt ? 'Resolved' : 'Open'}
                        </p>
                    </div>
                </div>

                {/* Probability Chart */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-slate-400 text-sm">YES</p>
                            <p className="text-3xl font-bold text-green-500">{market.yesProb}%</p>
                            <p className="text-sm text-slate-400">${yesPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex-1 mx-4 bg-slate-700 h-12 rounded-lg overflow-hidden flex">
                            <div
                                style={{ width: `${market.yesProb}%` }}
                                className="bg-green-600 transition-all"
                            ></div>
                            <div className="bg-red-600 flex-1"></div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-sm">NO</p>
                            <p className="text-3xl font-bold text-red-500">{100 - market.yesProb}%</p>
                            <p className="text-sm text-slate-400">${noPrice.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {!user ? (
                    <div className="bg-blue-900 border border-blue-700 text-blue-100 px-4 py-3 rounded-lg">
                        Please sign in to trade
                    </div>
                ) : market.resolvedAt ? (
                    <div className="bg-slate-700 border border-slate-600 text-slate-300 px-4 py-3 rounded-lg">
                        This market has been resolved
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Side
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setSelectedSide('YES')}
                                        className={`flex-1 py-2 rounded-lg font-semibold transition ${selectedSide === 'YES'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        YES ({yesPrice.toFixed(2)})
                                    </button>
                                    <button
                                        onClick={() => setSelectedSide('NO')}
                                        className={`flex-1 py-2 rounded-lg font-semibold transition ${selectedSide === 'NO'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        NO ({noPrice.toFixed(2)})
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Amount ($)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    placeholder="100"
                                    min="1"
                                    max={user.paperBalance}
                                />
                            </div>

                            <div className="bg-slate-700 p-4 rounded-lg">
                                <p className="text-slate-400 text-sm mb-2">
                                    Shares ({selectedPrice.toFixed(2)} per share)
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {shares.toFixed(2)}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleTrade}
                                    disabled={isTrading || !amount}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                                >
                                    {isTrading ? 'Placing Trade...' : 'Place Trade'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
