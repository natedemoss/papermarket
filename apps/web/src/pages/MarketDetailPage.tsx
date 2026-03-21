import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiClient, Market } from '../lib/api'
import { useAuth } from '../lib/store'

// Simulated order book rows
function OrderBookRow({ price, size, total, side }: { price: number; size: number; total: number; side: 'bid' | 'ask' }) {
    const maxTotal = 10000
    const depth = Math.min((total / maxTotal) * 100, 100)
    return (
        <div className="relative flex items-center justify-between px-3 py-1 text-xs font-tabular group">
            <div
                className={`absolute inset-0 opacity-10 ${side === 'bid' ? 'bg-pm-yes' : 'bg-pm-no'}`}
                style={{ width: `${depth}%`, [side === 'bid' ? 'right' : 'left']: 0, position: 'absolute' as const }}
            />
            <span className={side === 'bid' ? 'text-pm-yes' : 'text-pm-no'}>{price}¢</span>
            <span className="text-pm-muted">{size.toLocaleString()}</span>
            <span className="text-pm-subtle">{total.toLocaleString()}</span>
        </div>
    )
}

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
    const [tradeSuccess, setTradeSuccess] = useState<string | null>(null)
    const [activeChart, setActiveChart] = useState('1W')

    useEffect(() => {
        if (id) {
            setIsLoading(true)
            apiClient.getMarket(id)
                .then(data => { setMarket(data); setError(null) })
                .catch(() => setError('Failed to load market'))
                .finally(() => setIsLoading(false))
        }
    }, [id])

    const handleTrade = async () => {
        if (!user || !market || !id) return
        const tradeAmount = parseFloat(amount)
        if (isNaN(tradeAmount) || tradeAmount <= 0) { setError('Invalid amount'); return }
        if (tradeAmount > user.paperBalance) { setError('Insufficient balance'); return }
        setIsTrading(true)
        setError(null)
        try {
            const result = await apiClient.placeTrade(id, selectedSide, tradeAmount)
            setMarket(prev => prev && result.position.market ? {
                ...prev,
                yesProb: result.position.market.yesProb,
                volume: result.position.market.volume,
            } : prev)
            setUser({ ...user, paperBalance: result.userBalance })
            setAmount('100')
            setTradeSuccess(`Bought ${result.position.shares.toFixed(2)} ${selectedSide} shares · New balance: $${result.userBalance.toFixed(2)}`)
            setTimeout(() => setTradeSuccess(null), 4000)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Trade failed')
        } finally {
            setIsTrading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-pm-bg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
            </div>
        )
    }

    if (!market) {
        return (
            <div className="min-h-screen bg-pm-bg flex items-center justify-center">
                <div className="text-center">
                    <p className="text-pm-no mb-3 text-sm">Market not found</p>
                    <Link to="/markets" className="text-pm-blue text-sm hover:underline">Back to Markets</Link>
                </div>
            </div>
        )
    }

    const yesPrice = market.yesProb / 100
    const noPrice = (100 - market.yesProb) / 100
    const selectedPrice = selectedSide === 'YES' ? yesPrice : noPrice
    const shares = amount ? parseFloat(amount) / selectedPrice : 0
    const vol = market.volume >= 1000000
        ? `$${(market.volume / 1000000).toFixed(1)}M`
        : `$${(market.volume / 1000).toFixed(1)}K`

    // Simulated order book
    const asks = [
        { price: market.yesProb + 3, size: 1200, total: 1200 },
        { price: market.yesProb + 2, size: 2100, total: 3300 },
        { price: market.yesProb + 1, size: 800, total: 4100 },
    ]
    const bids = [
        { price: market.yesProb - 1, size: 3200, total: 3200 },
        { price: market.yesProb - 2, size: 1800, total: 5000 },
        { price: market.yesProb - 3, size: 5100, total: 10100 },
    ]

    return (
        <div className="min-h-screen bg-pm-bg">
            {/* Breadcrumb */}
            <div className="border-b border-pm-border bg-pm-surface">
                <div className="max-w-screen-xl mx-auto px-4 h-10 flex items-center gap-2">
                    <Link to="/markets" className="text-pm-muted hover:text-pm-text text-xs transition-colors">Markets</Link>
                    <span className="text-pm-subtle text-xs">/</span>
                    <span className="text-pm-text text-xs truncate max-w-xs">{market.title}</span>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <div className="flex gap-6 items-start">
                    {/* Left: Market info + chart + order book */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Market header */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wider ${
                                    market.category === 'POLITICS' ? 'bg-blue-950 text-blue-400' :
                                    market.category === 'CRYPTO' ? 'bg-orange-950 text-orange-400' :
                                    market.category === 'FINANCE' ? 'bg-green-950 text-green-400' :
                                    'bg-pm-card text-pm-muted'
                                }`}>
                                    {market.category}
                                </span>
                                {market.polymarketSynced && (
                                    <span className="text-xs text-pm-blue font-medium">LIVE</span>
                                )}
                                {market.resolvedAt && (
                                    <span className="text-xs text-pm-muted bg-pm-card px-2 py-0.5 rounded">RESOLVED</span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-pm-text leading-snug mb-4">{market.title}</h1>

                            {/* YES/NO probability display */}
                            <div className="flex items-center gap-6 mb-4">
                                <div>
                                    <div
                                        className="font-bold text-pm-yes"
                                        style={{ fontSize: '3.5rem', fontFamily: 'DM Sans', letterSpacing: '-0.04em', lineHeight: 1 }}
                                    >
                                        {market.yesProb}¢
                                    </div>
                                    <div className="text-pm-muted text-sm mt-1">YES probability</div>
                                </div>
                                <div className="text-pm-subtle text-2xl font-light">·</div>
                                <div>
                                    <div
                                        className="font-bold text-pm-no"
                                        style={{ fontSize: '3.5rem', fontFamily: 'DM Sans', letterSpacing: '-0.04em', lineHeight: 1 }}
                                    >
                                        {100 - market.yesProb}¢
                                    </div>
                                    <div className="text-pm-muted text-sm mt-1">NO probability</div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-pm-surface rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-pm-yes rounded-full transition-all duration-500"
                                    style={{ width: `${market.yesProb}%` }}
                                />
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-6">
                                <div>
                                    <div className="font-tabular text-pm-text font-semibold">{vol}</div>
                                    <div className="text-pm-subtle text-xs">Volume</div>
                                </div>
                                <div>
                                    <div className="font-tabular text-pm-text font-semibold">
                                        {market.closesAt ? new Date(market.closesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </div>
                                    <div className="text-pm-subtle text-xs">Closes</div>
                                </div>
                                <div>
                                    <div className="font-tabular text-pm-text font-semibold capitalize">
                                        {market.resolvedAt ? 'Resolved' : 'Open'}
                                    </div>
                                    <div className="text-pm-subtle text-xs">Status</div>
                                </div>
                            </div>
                        </div>

                        {/* Price chart placeholder */}
                        <div className="bg-pm-card border border-pm-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-pm-text">Price History</h3>
                                <div className="flex gap-1">
                                    {['1H', '1D', '1W', 'ALL'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setActiveChart(t)}
                                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                                activeChart === t
                                                    ? 'bg-pm-surface text-pm-text'
                                                    : 'text-pm-muted hover:text-pm-text'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Simulated chart using SVG */}
                            <div className="h-36 relative">
                                <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full">
                                    <defs>
                                        <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#00C278" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#00C278" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* YES area fill */}
                                    <path
                                        d={`M 0 ${100 - 45} C 50 ${100 - 50}, 100 ${100 - 55}, 150 ${100 - 52} S 250 ${100 - 60}, 300 ${100 - market.yesProb} S 350 ${100 - market.yesProb + 2}, 400 ${100 - market.yesProb} L 400 100 L 0 100 Z`}
                                        fill="url(#yesGrad)"
                                    />
                                    {/* YES line */}
                                    <path
                                        d={`M 0 ${100 - 45} C 50 ${100 - 50}, 100 ${100 - 55}, 150 ${100 - 52} S 250 ${100 - 60}, 300 ${100 - market.yesProb} S 350 ${100 - market.yesProb + 2}, 400 ${100 - market.yesProb}`}
                                        fill="none"
                                        stroke="#00C278"
                                        strokeWidth="1.5"
                                    />
                                    {/* Grid lines */}
                                    {[25, 50, 75].map(y => (
                                        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#2A2A2A" strokeWidth="0.5" />
                                    ))}
                                </svg>
                                {/* Y-axis labels */}
                                <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-0 pr-1">
                                    {['75¢', '50¢', '25¢'].map(l => (
                                        <span key={l} className="font-tabular text-2xs text-pm-subtle">{l}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Order book */}
                        <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-pm-border flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-pm-text">Order Book</h3>
                                <span className="font-tabular text-xs text-pm-muted">Spread: 2¢</span>
                            </div>
                            <div className="grid grid-cols-3 px-3 py-2 text-2xs text-pm-subtle font-medium uppercase tracking-wider border-b border-pm-border">
                                <span>Price</span>
                                <span className="text-center">Size</span>
                                <span className="text-right">Total</span>
                            </div>
                            {/* Asks */}
                            <div className="py-1">
                                {asks.reverse().map((row, i) => (
                                    <OrderBookRow key={i} {...row} side="ask" />
                                ))}
                            </div>
                            {/* Spread */}
                            <div className="px-3 py-1.5 bg-pm-surface border-y border-pm-border flex justify-center">
                                <span className="font-tabular text-xs text-pm-muted">— spread 2¢ —</span>
                            </div>
                            {/* Bids */}
                            <div className="py-1">
                                {bids.map((row, i) => (
                                    <OrderBookRow key={i} {...row} side="bid" />
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        {market.description && (
                            <div className="bg-pm-card border border-pm-border rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-pm-text mb-2">Resolution Criteria</h3>
                                <p className="text-sm text-pm-muted leading-relaxed">{market.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Trade panel */}
                    <div className="w-80 shrink-0 sticky top-20 space-y-3">
                        <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
                            {/* Side selector */}
                            <div className="grid grid-cols-2">
                                <button
                                    onClick={() => setSelectedSide('YES')}
                                    className={`py-3 text-sm font-semibold transition-colors border-b-2 ${
                                        selectedSide === 'YES'
                                            ? 'text-pm-yes border-pm-yes bg-pm-yes-dim'
                                            : 'text-pm-muted border-transparent hover:text-pm-text'
                                    }`}
                                >
                                    YES · {market.yesProb}¢
                                </button>
                                <button
                                    onClick={() => setSelectedSide('NO')}
                                    className={`py-3 text-sm font-semibold transition-colors border-b-2 ${
                                        selectedSide === 'NO'
                                            ? 'text-pm-no border-pm-no bg-pm-no-dim'
                                            : 'text-pm-muted border-transparent hover:text-pm-text'
                                    }`}
                                >
                                    NO · {100 - market.yesProb}¢
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {!user ? (
                                    <div className="text-center py-4 space-y-3">
                                        <p className="text-pm-muted text-sm">Sign in to trade</p>
                                        <Link
                                            to="/login"
                                            className="block w-full py-2.5 bg-pm-blue hover:bg-blue-600 text-white text-sm font-semibold rounded-lg text-center transition-colors"
                                        >
                                            Sign in
                                        </Link>
                                    </div>
                                ) : market.resolvedAt ? (
                                    <div className="text-center py-4 text-pm-muted text-sm">
                                        This market has been resolved
                                    </div>
                                ) : (
                                    <>
                                        {/* Amount input */}
                                        <div>
                                            <label className="block text-xs text-pm-muted mb-2">Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pm-muted text-sm font-medium">$</span>
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={e => setAmount(e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2.5 bg-pm-surface border border-pm-border rounded-lg text-pm-text text-sm font-medium focus:outline-none focus:border-pm-blue transition-colors"
                                                    placeholder="100"
                                                    min="1"
                                                    max={user.paperBalance}
                                                />
                                            </div>
                                            {/* Quick amounts */}
                                            <div className="flex gap-1.5 mt-2">
                                                {['10', '50', '100', '500'].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => setAmount(v)}
                                                        className="flex-1 py-1 text-xs text-pm-muted bg-pm-surface border border-pm-border rounded hover:border-pm-subtle hover:text-pm-text transition-colors"
                                                    >
                                                        ${v}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="bg-pm-surface rounded-lg p-3 space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-pm-muted">Avg price</span>
                                                <span className="font-tabular text-pm-text">{selectedPrice.toFixed(2)}¢</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-pm-muted">Shares</span>
                                                <span className="font-tabular text-pm-text">{isNaN(shares) ? '—' : shares.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-pm-muted">Max payout</span>
                                                <span className="font-tabular text-pm-yes">${isNaN(shares) ? '—' : shares.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs border-t border-pm-border pt-2">
                                                <span className="text-pm-muted">Balance after</span>
                                                <span className="font-tabular text-pm-text">
                                                    ${(user.paperBalance - (parseFloat(amount) || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Error / Success */}
                                        {error && (
                                            <div className="bg-red-950 border border-pm-no/30 text-pm-no text-xs px-3 py-2 rounded-lg">
                                                {error}
                                            </div>
                                        )}
                                        {tradeSuccess && (
                                            <div className="bg-green-950 border border-pm-yes/30 text-pm-yes text-xs px-3 py-2 rounded-lg">
                                                {tradeSuccess}
                                            </div>
                                        )}

                                        {/* Confirm button */}
                                        <button
                                            onClick={handleTrade}
                                            disabled={isTrading || !amount || parseFloat(amount) <= 0}
                                            className={`w-full py-3 text-sm font-semibold rounded-lg transition-all ${
                                                selectedSide === 'YES'
                                                    ? 'bg-pm-yes hover:bg-green-500 text-black disabled:opacity-40'
                                                    : 'bg-pm-no hover:bg-red-500 text-white disabled:opacity-40'
                                            }`}
                                        >
                                            {isTrading ? 'Placing order...' : `Buy ${selectedSide}`}
                                        </button>

                                        <p className="text-pm-subtle text-2xs text-center">
                                            Balance: <span className="font-tabular">${user.paperBalance.toFixed(2)}</span>
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
