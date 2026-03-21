import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient, Market } from '../lib/api'
import { useMarkets } from '../lib/store'

const CATEGORY_TABS = [
    { label: 'All', value: '' },
    { label: 'Politics', value: 'POLITICS' },
    { label: 'Crypto', value: 'CRYPTO' },
    { label: 'Finance', value: 'FINANCE' },
    { label: 'Tech', value: 'TECH' },
    { label: 'Science', value: 'SCIENCE' },
    { label: 'Sports', value: 'SPORTS' },
]

function MarketRow({ market }: { market: Market }) {
    const yesProb = market.yesProb
    const noProb = 100 - yesProb
    const vol = market.volume >= 1000000
        ? `$${(market.volume / 1000000).toFixed(1)}M`
        : market.volume >= 1000
            ? `$${(market.volume / 1000).toFixed(0)}K`
            : `$${market.volume.toFixed(0)}`

    return (
        <Link
            to={`/markets/${market.id}`}
            className="bg-pm-card border border-pm-border rounded-xl p-4 hover:border-pm-subtle transition-all duration-150 flex items-center gap-4 group"
        >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-pm-surface flex-shrink-0 flex items-center justify-center text-base">
                {market.category === 'CRYPTO' ? '₿' :
                 market.category === 'POLITICS' ? '🏛' :
                 market.category === 'SPORTS' ? '⚽' :
                 market.category === 'TECH' ? '💻' :
                 market.category === 'SCIENCE' ? '🔬' :
                 market.category === 'FINANCE' ? '📈' : '📊'}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-pm-text group-hover:text-white transition-colors line-clamp-1">
                    {market.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="font-tabular text-xs text-pm-subtle">{vol} vol</span>
                    {market.closesAt && (
                        <span className="font-tabular text-xs text-pm-subtle">
                            Closes {new Date(market.closesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                    {market.polymarketSynced && (
                        <span className="text-xs text-pm-blue">LIVE</span>
                    )}
                </div>
            </div>

            {/* Probability bar (narrow) */}
            <div className="hidden sm:block w-20">
                <div className="h-1.5 bg-pm-surface rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-pm-yes rounded-full" style={{ width: `${yesProb}%` }} />
                </div>
            </div>

            {/* YES / NO */}
            <div className="flex gap-2 shrink-0">
                <button
                    onClick={e => { e.preventDefault(); }}
                    className="flex flex-col items-center bg-pm-yes-dim hover:bg-green-900 border border-pm-yes/20 rounded-lg px-3 py-1.5 transition-colors min-w-[56px]"
                >
                    <span className="text-pm-yes text-2xs font-semibold">YES</span>
                    <span className="font-tabular text-pm-yes font-bold text-sm">{yesProb}¢</span>
                </button>
                <button
                    onClick={e => { e.preventDefault(); }}
                    className="flex flex-col items-center bg-pm-no-dim hover:bg-red-900 border border-pm-no/20 rounded-lg px-3 py-1.5 transition-colors min-w-[56px]"
                >
                    <span className="text-pm-no text-2xs font-semibold">NO</span>
                    <span className="font-tabular text-pm-no font-bold text-sm">{noProb}¢</span>
                </button>
            </div>
        </Link>
    )
}

export default function MarketsPage() {
    const { markets, setMarkets, isLoading, setLoading, error, setError } = useMarkets()
    const [category, setCategory] = useState('')
    const [sort, setSort] = useState<'volume' | 'newest' | 'closing_soon'>('volume')

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await apiClient.getMarkets(category || undefined, sort)
                setMarkets(data)
            } catch {
                setError('Failed to load markets')
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [category, sort, setMarkets, setLoading, setError])

    return (
        <div className="min-h-screen bg-pm-bg">
            <div className="max-w-screen-xl mx-auto px-4 py-6">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold text-pm-text">Markets</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-pm-subtle text-xs">Sort by:</span>
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as any)}
                            className="bg-pm-card border border-pm-border text-pm-text text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-pm-blue"
                        >
                            <option value="volume">Volume</option>
                            <option value="newest">Newest</option>
                            <option value="closing_soon">Closing Soon</option>
                        </select>
                    </div>
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar border-b border-pm-border pb-0">
                    {CATEGORY_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setCategory(tab.value)}
                            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                category === tab.value
                                    ? 'border-pm-blue text-pm-text'
                                    : 'border-transparent text-pm-muted hover:text-pm-text'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-950 border border-pm-no/30 text-pm-no px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* Markets list */}
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-6 h-6 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
                        <p className="text-pm-muted text-sm mt-3">Loading markets...</p>
                    </div>
                ) : markets.length === 0 ? (
                    <div className="text-center py-20 text-pm-muted text-sm">
                        No markets available
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {markets.map((market: Market) => (
                            <MarketRow key={market.id} market={market} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
