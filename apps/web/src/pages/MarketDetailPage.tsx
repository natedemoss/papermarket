import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiClient, Market, Comment } from '../lib/api'
import { useAuth } from '../lib/store'

// ─── Chart ───────────────────────────────────────────────────────────────────

type TimeRange = '1H' | '1D' | '1W' | '1M' | 'ALL'

function generateHistory(currentProb: number, points: number, volatility: number): number[] {
    const history: number[] = []
    // Walk backwards from current probability
    let p = currentProb
    for (let i = 0; i < points; i++) {
        history.unshift(Math.min(99, Math.max(1, Math.round(p))))
        const drift = (Math.random() - 0.52) * volatility
        p = p - drift
        p = Math.min(99, Math.max(1, p))
    }
    return history
}

const TIME_RANGES: { label: TimeRange; points: number; vol: number; xLabels: string[] }[] = [
    { label: '1H', points: 60, vol: 0.4, xLabels: ['60m', '45m', '30m', '15m', 'Now'] },
    { label: '1D', points: 96, vol: 1.2, xLabels: ['24h', '18h', '12h', '6h', 'Now'] },
    { label: '1W', points: 168, vol: 2.5, xLabels: ['7d', '5d', '3d', '1d', 'Now'] },
    { label: '1M', points: 120, vol: 4.0, xLabels: ['30d', '22d', '15d', '7d', 'Now'] },
    { label: 'ALL', points: 180, vol: 6.0, xLabels: ['6mo', '4mo', '2mo', '1mo', 'Now'] },
]

function PriceChart({ market, activeRange, onRangeChange }: {
    market: Market
    activeRange: TimeRange
    onRangeChange: (r: TimeRange) => void
}) {
    const rangeConfig = TIME_RANGES.find(r => r.label === activeRange) ?? TIME_RANGES[2]

    const yesHistory = useMemo(
        () => generateHistory(market.yesProb, rangeConfig.points, rangeConfig.vol),
        [market.id, activeRange, market.yesProb]
    )

    const min = Math.max(0, Math.min(...yesHistory) - 5)
    const max = Math.min(100, Math.max(...yesHistory) + 5)
    const range = max - min || 1

    const W = 600
    const H = 180
    const PAD = { top: 12, right: 8, bottom: 24, left: 32 }
    const chartW = W - PAD.left - PAD.right
    const chartH = H - PAD.top - PAD.bottom

    const toX = (i: number) => PAD.left + (i / (yesHistory.length - 1)) * chartW
    const toY = (v: number) => PAD.top + chartH - ((v - min) / range) * chartH

    const linePath = yesHistory.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ')
    const areaPath = `${linePath} L ${toX(yesHistory.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left} ${(PAD.top + chartH).toFixed(1)} Z`

    const currentVal = yesHistory[yesHistory.length - 1]
    const startVal = yesHistory[0]
    const change = currentVal - startVal
    const isUp = change >= 0

    // Y-axis grid lines
    const gridLines = [25, 50, 75].filter(v => v >= min && v <= max)

    return (
        <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
            {/* Chart header */}
            <div className="px-5 pt-4 pb-3 flex items-start justify-between border-b border-pm-border">
                <div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-pm-text" style={{ fontFamily: 'DM Sans', letterSpacing: '-0.03em' }}>
                            {currentVal}¢
                        </span>
                        <span className={`font-tabular text-sm font-semibold ${isUp ? 'text-pm-yes' : 'text-pm-no'}`}>
                            {isUp ? '+' : ''}{change}¢ ({activeRange})
                        </span>
                    </div>
                    <p className="text-pm-muted text-xs mt-0.5">YES probability</p>
                </div>
                <div className="flex gap-1">
                    {TIME_RANGES.map(r => (
                        <button
                            key={r.label}
                            onClick={() => onRangeChange(r.label)}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                activeRange === r.label
                                    ? 'bg-pm-surface text-pm-text border border-pm-border'
                                    : 'text-pm-muted hover:text-pm-text'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* SVG Chart */}
            <div className="px-2 pt-2 pb-1">
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 180 }}>
                    <defs>
                        <linearGradient id={`grad-${market.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isUp ? '#00C278' : '#FF5A5A'} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={isUp ? '#00C278' : '#FF5A5A'} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {gridLines.map(v => (
                        <g key={v}>
                            <line
                                x1={PAD.left} y1={toY(v)}
                                x2={W - PAD.right} y2={toY(v)}
                                stroke="#2A2A2A" strokeWidth="1"
                            />
                            <text x={PAD.left - 4} y={toY(v) + 4} textAnchor="end" fill="#555" fontSize="9" fontFamily="DM Mono">
                                {v}¢
                            </text>
                        </g>
                    ))}

                    {/* Area fill */}
                    <path d={areaPath} fill={`url(#grad-${market.id})`} />

                    {/* Line */}
                    <path d={linePath} fill="none" stroke={isUp ? '#00C278' : '#FF5A5A'} strokeWidth="1.5" strokeLinejoin="round" />

                    {/* Current price dot */}
                    <circle
                        cx={toX(yesHistory.length - 1)}
                        cy={toY(currentVal)}
                        r="3"
                        fill={isUp ? '#00C278' : '#FF5A5A'}
                    />

                    {/* X-axis labels */}
                    {rangeConfig.xLabels.map((label, i) => {
                        const x = PAD.left + (i / (rangeConfig.xLabels.length - 1)) * chartW
                        return (
                            <text key={i} x={x} y={H - 4} textAnchor="middle" fill="#555" fontSize="9" fontFamily="DM Mono">
                                {label}
                            </text>
                        )
                    })}
                </svg>
            </div>

            {/* NO line summary */}
            <div className="px-5 pb-4 flex items-center gap-6 border-t border-pm-border pt-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pm-yes" />
                    <span className="text-pm-muted text-xs">YES</span>
                    <span className="font-tabular text-pm-yes text-xs font-semibold">{market.yesProb}¢</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pm-no" />
                    <span className="text-pm-muted text-xs">NO</span>
                    <span className="font-tabular text-pm-no text-xs font-semibold">{100 - market.yesProb}¢</span>
                </div>
                <div className="ml-auto font-tabular text-xs text-pm-subtle">
                    Vol: {market.volume >= 1e6 ? `$${(market.volume / 1e6).toFixed(1)}M` : `$${(market.volume / 1e3).toFixed(0)}K`}
                </div>
            </div>
        </div>
    )
}

// ─── Order Book ───────────────────────────────────────────────────────────────

function OrderBook({ yesProb }: { yesProb: number }) {
    const asks = [
        { price: yesProb + 3, size: 1200, total: 1200 },
        { price: yesProb + 2, size: 2100, total: 3300 },
        { price: yesProb + 1, size: 800, total: 4100 },
    ].reverse()
    const bids = [
        { price: yesProb - 1, size: 3200, total: 3200 },
        { price: yesProb - 2, size: 1800, total: 5000 },
        { price: yesProb - 3, size: 5100, total: 10100 },
    ]
    const maxTotal = 10100

    const Row = ({ price, size, total, side }: { price: number; size: number; total: number; side: 'ask' | 'bid' }) => (
        <div className="relative flex items-center justify-between px-4 py-1.5 text-xs font-tabular">
            <div
                className={`absolute inset-y-0 opacity-10 ${side === 'bid' ? 'bg-pm-yes right-0' : 'bg-pm-no left-0'}`}
                style={{ width: `${(total / maxTotal) * 100}%` }}
            />
            <span className={side === 'bid' ? 'text-pm-yes' : 'text-pm-no'}>{price}¢</span>
            <span className="text-pm-muted">{size.toLocaleString()}</span>
            <span className="text-pm-subtle">{total.toLocaleString()}</span>
        </div>
    )

    return (
        <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-pm-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-pm-text">Order Book</h3>
                <span className="font-tabular text-xs text-pm-muted">Spread: 2¢</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2 text-2xs text-pm-subtle font-medium uppercase tracking-wider border-b border-pm-border">
                <span>Price</span><span className="text-center">Size</span><span className="text-right">Total</span>
            </div>
            <div className="py-0.5">{asks.map((r, i) => <Row key={i} {...r} side="ask" />)}</div>
            <div className="py-1.5 flex justify-center border-y border-pm-border bg-pm-surface">
                <span className="font-tabular text-xs text-pm-muted">— spread 2¢ —</span>
            </div>
            <div className="py-0.5">{bids.map((r, i) => <Row key={i} {...r} side="bid" />)}</div>
        </div>
    )
}

// ─── Comments ─────────────────────────────────────────────────────────────────

function CommentsSection({ marketId }: { marketId: string }) {
    const { user } = useAuth()
    const [comments, setComments] = useState<Comment[]>([])
    const [input, setInput] = useState('')
    const [posting, setPosting] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiClient.getComments(marketId)
            .then(setComments)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [marketId])

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || posting) return
        setPosting(true)
        try {
            const comment = await apiClient.postComment(marketId, input.trim())
            setComments(prev => [comment, ...prev])
            setInput('')
        } catch {}
        finally { setPosting(false) }
    }

    const handleDelete = async (commentId: string) => {
        try {
            await apiClient.deleteComment(marketId, commentId)
            setComments(prev => prev.filter(c => c.id !== commentId))
        } catch {}
    }

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        return `${Math.floor(hrs / 24)}d ago`
    }

    return (
        <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-pm-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-pm-text">Discussion</h3>
                <span className="font-tabular text-xs text-pm-muted">{comments.length} comments</span>
            </div>

            {/* Comment form */}
            {user ? (
                <form onSubmit={handlePost} className="px-5 py-4 border-b border-pm-border">
                    <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-pm-blue flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                            {user.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Share your analysis..."
                                rows={2}
                                maxLength={500}
                                className="w-full px-3 py-2 bg-pm-surface border border-pm-border rounded-lg text-pm-text text-sm placeholder-pm-subtle focus:outline-none focus:border-pm-blue resize-none transition-colors"
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-tabular text-2xs text-pm-subtle">{input.length}/500</span>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || posting}
                                    className="px-3 py-1.5 bg-pm-blue hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors"
                                >
                                    {posting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="px-5 py-4 border-b border-pm-border text-center">
                    <Link to="/login" className="text-pm-blue text-sm hover:underline">Sign in</Link>
                    <span className="text-pm-muted text-sm"> to join the discussion</span>
                </div>
            )}

            {/* Comment list */}
            <div className="divide-y divide-pm-border">
                {loading ? (
                    <div className="px-5 py-8 text-center">
                        <div className="inline-block w-4 h-4 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="px-5 py-8 text-center text-pm-muted text-sm">
                        No comments yet. Be the first to share your analysis.
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="px-5 py-4 flex gap-3 group">
                            <div className="w-7 h-7 rounded-full bg-pm-surface border border-pm-border flex items-center justify-center text-pm-muted text-xs font-bold shrink-0 mt-0.5">
                                {comment.user.username[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-pm-text text-xs font-semibold">{comment.user.username}</span>
                                    <span className="font-tabular text-pm-subtle text-2xs">{timeAgo(comment.createdAt)}</span>
                                </div>
                                <p className="text-pm-muted text-sm leading-relaxed break-words">{comment.content}</p>
                            </div>
                            {(user?.id === comment.userId || user?.isAdmin) && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="opacity-0 group-hover:opacity-100 text-pm-subtle hover:text-pm-no text-xs transition-all shrink-0"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// ─── Trade Panel ──────────────────────────────────────────────────────────────

function TradePanel({ market, onTradeSuccess }: {
    market: Market
    onTradeSuccess: (newProb: number, newVolume: number, newBalance: number) => void
}) {
    const { user, setUser } = useAuth()
    const [side, setSide] = useState<'YES' | 'NO'>('YES')
    const [amount, setAmount] = useState('100')
    const [trading, setTrading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const price = side === 'YES' ? market.yesProb / 100 : (100 - market.yesProb) / 100
    const shares = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) / price : 0

    const handleTrade = async () => {
        if (!user || !market) return
        const tradeAmount = parseFloat(amount)
        if (isNaN(tradeAmount) || tradeAmount <= 0) { setError('Invalid amount'); return }
        if (tradeAmount > Number(user.paperBalance)) { setError('Insufficient balance'); return }
        setTrading(true); setError(null)
        try {
            const result = await apiClient.placeTrade(market.id, side, tradeAmount)
            setUser({ ...user, paperBalance: result.userBalance })
            onTradeSuccess(
                result.position.market?.yesProb ?? market.yesProb,
                result.position.market?.volume ?? market.volume,
                result.userBalance
            )
            setAmount('100')
            setSuccess(`Bought ${result.position.shares.toFixed(2)} ${side} @ ${(price * 100).toFixed(0)}¢`)
            setTimeout(() => setSuccess(null), 5000)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Trade failed')
        } finally { setTrading(false) }
    }

    return (
        <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden sticky top-20">
            {/* YES / NO toggle */}
            <div className="grid grid-cols-2 border-b border-pm-border">
                {(['YES', 'NO'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setSide(s)}
                        className={`py-3.5 text-sm font-bold transition-colors border-b-2 ${
                            side === s
                                ? s === 'YES'
                                    ? 'text-pm-yes border-pm-yes bg-pm-yes-dim'
                                    : 'text-pm-no border-pm-no bg-pm-no-dim'
                                : 'text-pm-muted border-transparent hover:text-pm-text'
                        }`}
                    >
                        {s} · {s === 'YES' ? market.yesProb : 100 - market.yesProb}¢
                    </button>
                ))}
            </div>

            <div className="p-4 space-y-4">
                {!user ? (
                    <div className="text-center py-6 space-y-3">
                        <p className="text-pm-muted text-sm">Sign in to trade</p>
                        <Link to="/login" className="block w-full py-2.5 bg-pm-blue hover:bg-blue-600 text-white text-sm font-semibold rounded-lg text-center transition-colors">
                            Sign in
                        </Link>
                        <Link to="/register" className="block w-full py-2.5 border border-pm-border text-pm-muted hover:text-pm-text text-sm font-medium rounded-lg text-center transition-colors">
                            Create account
                        </Link>
                    </div>
                ) : market.resolvedAt ? (
                    <div className="text-center py-6 text-pm-muted text-sm">Market resolved</div>
                ) : (
                    <>
                        <div>
                            <label className="block text-xs text-pm-muted mb-1.5">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pm-muted text-sm">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => { setAmount(e.target.value); setError(null) }}
                                    className="w-full pl-7 pr-3 py-2.5 bg-pm-surface border border-pm-border rounded-lg text-pm-text text-sm font-medium focus:outline-none focus:border-pm-blue transition-colors"
                                    min="1"
                                    max={user.paperBalance}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-1 mt-2">
                                {['10', '50', '100', '500'].map(v => (
                                    <button key={v} onClick={() => setAmount(v)}
                                        className="py-1 text-xs text-pm-muted bg-pm-surface border border-pm-border rounded hover:border-pm-subtle hover:text-pm-text transition-colors">
                                        ${v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-pm-surface rounded-lg p-3 space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-pm-muted">Avg price</span><span className="font-tabular text-pm-text">{(price * 100).toFixed(0)}¢</span></div>
                            <div className="flex justify-between"><span className="text-pm-muted">Shares</span><span className="font-tabular text-pm-text">{isNaN(shares) ? '—' : shares.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-pm-muted">Max payout</span><span className="font-tabular text-pm-yes">${isNaN(shares) ? '—' : shares.toFixed(2)}</span></div>
                            <div className="flex justify-between border-t border-pm-border pt-2">
                                <span className="text-pm-muted">Balance after</span>
                                <span className="font-tabular text-pm-text">${Math.max(0, Number(user.paperBalance) - (parseFloat(amount) || 0)).toFixed(2)}</span>
                            </div>
                        </div>

                        {error && <div className="bg-red-950 border border-pm-no/30 text-pm-no text-xs px-3 py-2 rounded-lg">{error}</div>}
                        {success && <div className="bg-green-950 border border-pm-yes/30 text-pm-yes text-xs px-3 py-2 rounded-lg">{success}</div>}

                        <button
                            onClick={handleTrade}
                            disabled={trading || !amount || parseFloat(amount) <= 0}
                            className={`w-full py-3 text-sm font-bold rounded-lg transition-all ${
                                side === 'YES'
                                    ? 'bg-pm-yes hover:bg-green-400 text-black disabled:opacity-40'
                                    : 'bg-pm-no hover:bg-red-400 text-white disabled:opacity-40'
                            }`}
                        >
                            {trading ? 'Placing order...' : `Buy ${side}`}
                        </button>
                        <p className="font-tabular text-pm-subtle text-2xs text-center">
                            Balance: ${Number(user.paperBalance).toFixed(2)}
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
    POLITICS: 'bg-blue-950 text-blue-400',
    CRYPTO: 'bg-orange-950 text-orange-400',
    FINANCE: 'bg-green-950 text-green-400',
    TECH: 'bg-purple-950 text-purple-400',
    SCIENCE: 'bg-cyan-950 text-cyan-400',
    SPORTS: 'bg-red-950 text-red-400',
    OTHER: 'bg-pm-surface text-pm-muted',
}

export default function MarketDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [market, setMarket] = useState<Market | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeRange, setActiveRange] = useState<TimeRange>('1W')

    useEffect(() => {
        if (!id) return
        setLoading(true)
        apiClient.getMarket(id)
            .then(setMarket)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [id])

    const handleTradeSuccess = (newProb: number, newVolume: number, _balance: number) => {
        setMarket(prev => prev ? { ...prev, yesProb: newProb, volume: newVolume } : prev)
    }

    if (loading) return (
        <div className="min-h-screen bg-pm-bg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
        </div>
    )

    if (!market) return (
        <div className="min-h-screen bg-pm-bg flex items-center justify-center">
            <div className="text-center">
                <p className="text-pm-no text-sm mb-3">Market not found</p>
                <Link to="/markets" className="text-pm-blue text-sm hover:underline">Back to Markets</Link>
            </div>
        </div>
    )

    const vol = market.volume >= 1e6 ? `$${(market.volume / 1e6).toFixed(1)}M` : `$${(market.volume / 1e3).toFixed(1)}K`

    return (
        <div className="min-h-screen bg-pm-bg">
            {/* Breadcrumb */}
            <div className="border-b border-pm-border bg-pm-surface">
                <div className="max-w-screen-xl mx-auto px-4 h-10 flex items-center gap-2 text-xs">
                    <Link to="/markets" className="text-pm-muted hover:text-pm-text transition-colors">Markets</Link>
                    <span className="text-pm-subtle">/</span>
                    <span className="text-pm-text truncate max-w-sm">{market.title}</span>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <div className="flex gap-6 items-start">
                    {/* Left column */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Market header */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wider ${CATEGORY_COLORS[market.category] ?? CATEGORY_COLORS.OTHER}`}>
                                    {market.category}
                                </span>
                                {market.polymarketSynced && (
                                    <span className="text-xs text-pm-blue font-medium">LIVE</span>
                                )}
                                {market.resolvedAt && (
                                    <span className="text-xs bg-pm-surface border border-pm-border text-pm-muted px-2 py-0.5 rounded">RESOLVED</span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-pm-text leading-snug mb-4">{market.title}</h1>

                            {/* Stats */}
                            <div className="flex items-center gap-6 flex-wrap">
                                <div>
                                    <p className="font-tabular text-pm-text font-semibold">{vol}</p>
                                    <p className="text-pm-subtle text-xs">Volume</p>
                                </div>
                                <div>
                                    <p className="font-tabular text-pm-text font-semibold">
                                        {market.closesAt ? new Date(market.closesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </p>
                                    <p className="text-pm-subtle text-xs">Closes</p>
                                </div>
                                <div>
                                    <p className="font-tabular text-pm-text font-semibold capitalize">
                                        {market.resolvedAt ? 'Resolved' : 'Open'}
                                    </p>
                                    <p className="text-pm-subtle text-xs">Status</p>
                                </div>
                            </div>
                        </div>

                        {/* CHART — front and center */}
                        <PriceChart market={market} activeRange={activeRange} onRangeChange={setActiveRange} />

                        {/* Order Book */}
                        <OrderBook yesProb={market.yesProb} />

                        {/* Description */}
                        {market.description && (
                            <div className="bg-pm-card border border-pm-border rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-pm-text mb-2">Resolution Criteria</h3>
                                <p className="text-sm text-pm-muted leading-relaxed">{market.description}</p>
                            </div>
                        )}

                        {/* Comments */}
                        <CommentsSection marketId={market.id} />
                    </div>

                    {/* Right column — trade panel */}
                    <div className="w-72 shrink-0">
                        <TradePanel market={market} onTradeSuccess={handleTradeSuccess} />
                    </div>
                </div>
            </div>
        </div>
    )
}
