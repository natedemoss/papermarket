import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiClient, Market } from '../lib/api'
import { useAuth } from '../lib/store'

const CATEGORIES = ['All', 'Politics', 'Crypto', 'Finance', 'Tech', 'Science', 'Sports']

const BREAKING_NEWS = [
    { change: '+18%', label: 'Fed signals rate pause through Q3', up: true },
    { change: '+12%', label: 'GOP gains Senate seat in early count', up: true },
    { change: '-9%', label: 'Bitcoin ETF approval delayed again', up: false },
    { change: '+22%', label: 'SpaceX Starship orbital test approved', up: true },
    { change: '-14%', label: 'EU AI Act fast-track vote delayed', up: false },
]

function CategoryBadge({ category }: { category: string }) {
    const colors: Record<string, string> = {
        POLITICS: 'bg-blue-950 text-blue-400',
        CRYPTO: 'bg-orange-950 text-orange-400',
        FINANCE: 'bg-green-950 text-green-400',
        TECH: 'bg-purple-950 text-purple-400',
        SCIENCE: 'bg-cyan-950 text-cyan-400',
        SPORTS: 'bg-red-950 text-red-400',
        OTHER: 'bg-pm-card text-pm-muted',
    }
    return (
        <span className={`text-2xs font-medium px-2 py-0.5 rounded uppercase tracking-wider ${colors[category] ?? colors.OTHER}`}>
            {category}
        </span>
    )
}

function MarketCard({ market }: { market: Market }) {
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
            className="bg-pm-card border border-pm-border rounded-xl p-4 hover:border-pm-subtle transition-all duration-150 flex flex-col gap-3 group"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-pm-surface flex-shrink-0 flex items-center justify-center text-lg">
                    {market.category === 'CRYPTO' ? '₿' :
                     market.category === 'POLITICS' ? '🏛' :
                     market.category === 'SPORTS' ? '⚽' :
                     market.category === 'TECH' ? '💻' :
                     market.category === 'SCIENCE' ? '🔬' :
                     market.category === 'FINANCE' ? '📈' : '📊'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-pm-text leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {market.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <CategoryBadge category={market.category} />
                        <span className="font-tabular text-2xs text-pm-subtle">{vol} vol</span>
                    </div>
                </div>
            </div>

            {/* Probability bar */}
            <div className="h-1 bg-pm-surface rounded-full overflow-hidden">
                <div
                    className="h-full bg-pm-yes rounded-full transition-all"
                    style={{ width: `${yesProb}%` }}
                />
            </div>

            {/* YES / NO buttons */}
            <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-between bg-pm-yes-dim hover:bg-green-900 border border-pm-yes/20 rounded-lg px-3 py-2 transition-colors group/yes">
                    <span className="text-pm-yes text-xs font-semibold">YES</span>
                    <span className="font-tabular text-pm-yes font-bold">{yesProb}¢</span>
                </button>
                <button className="flex-1 flex items-center justify-between bg-pm-no-dim hover:bg-red-900 border border-pm-no/20 rounded-lg px-3 py-2 transition-colors group/no">
                    <span className="text-pm-no text-xs font-semibold">NO</span>
                    <span className="font-tabular text-pm-no font-bold">{noProb}¢</span>
                </button>
            </div>
        </Link>
    )
}

function FeaturedCard({ market, index }: { market: Market; index: number }) {
    const yesProb = market.yesProb
    const vol = market.volume >= 1000000
        ? `$${(market.volume / 1000000).toFixed(1)}M`
        : `$${(market.volume / 1000).toFixed(0)}K`

    const gradients = [
        'from-blue-950 to-pm-card',
        'from-purple-950 to-pm-card',
        'from-green-950 to-pm-card',
        'from-orange-950 to-pm-card',
        'from-red-950 to-pm-card',
        'from-cyan-950 to-pm-card',
        'from-indigo-950 to-pm-card',
    ]

    return (
        <Link
            to={`/markets/${market.id}`}
            className={`flex-shrink-0 w-64 bg-gradient-to-br ${gradients[index % gradients.length]} border border-pm-border rounded-xl p-4 hover:border-pm-subtle transition-all flex flex-col gap-3`}
        >
            <div className="flex items-center gap-2">
                <CategoryBadge category={market.category} />
                {market.polymarketSynced && (
                    <span className="text-2xs text-pm-muted font-tabular">LIVE</span>
                )}
            </div>
            <p className="text-sm font-semibold text-pm-text leading-snug line-clamp-3 flex-1">
                {market.title}
            </p>
            <div>
                <div className="text-4xl font-bold text-pm-text mb-1" style={{ fontFamily: 'DM Sans', letterSpacing: '-0.03em' }}>
                    {yesProb}¢
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-tabular text-xs text-pm-muted">{vol} vol</span>
                    <div className="flex-1 h-0.5 bg-pm-surface rounded overflow-hidden">
                        <div className="h-full bg-pm-yes" style={{ width: `${yesProb}%` }} />
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default function HomePage() {
    const { user } = useAuth()
    const [markets, setMarkets] = useState<Market[]>([])
    const [activeCategory, setActiveCategory] = useState('All')
    const carouselRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        apiClient.getMarkets(undefined, 'volume').then(setMarkets).catch(() => {})
    }, [])

    const categoryMap: Record<string, string> = {
        Politics: 'POLITICS', Crypto: 'CRYPTO', Finance: 'FINANCE',
        Tech: 'TECH', Science: 'SCIENCE', Sports: 'SPORTS',
    }

    const filteredMarkets = activeCategory === 'All'
        ? markets
        : markets.filter(m => m.category === categoryMap[activeCategory])

    const featuredMarkets = markets.slice(0, 7)

    const scrollCarousel = (dir: 'left' | 'right') => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-pm-bg">
            {/* Hero banner */}
            {!user && (
                <div className="border-b border-pm-border bg-gradient-to-r from-pm-surface to-pm-bg">
                    <div className="max-w-screen-xl mx-auto px-4 py-10 flex items-center justify-between gap-8">
                        <div>
                            <h1 className="text-3xl font-bold text-pm-text mb-2">
                                Trade what you know.
                            </h1>
                            <p className="text-pm-muted text-sm max-w-md">
                                Predict real-world outcomes with play money. No risk, pure strategy. Compete with traders on global events.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-sm text-pm-muted border border-pm-border rounded-lg hover:border-pm-subtle hover:text-pm-text transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-2 text-sm font-semibold bg-pm-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                                Start trading free
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Featured carousel */}
                        {featuredMarkets.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-semibold text-pm-muted uppercase tracking-wider">Featured</h2>
                                    <div className="flex gap-1">
                                        <button onClick={() => scrollCarousel('left')} className="p-1 rounded text-pm-muted hover:text-pm-text hover:bg-pm-card transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={() => scrollCarousel('right')} className="p-1 rounded text-pm-muted hover:text-pm-text hover:bg-pm-card transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div
                                    ref={carouselRef}
                                    className="flex gap-3 overflow-x-auto no-scrollbar pb-1"
                                >
                                    {featuredMarkets.map((m, i) => (
                                        <FeaturedCard key={m.id} market={m} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category tabs */}
                        <div className="flex items-center gap-1 mb-5 overflow-x-auto no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeCategory === cat
                                            ? 'bg-pm-card text-pm-text border border-pm-border'
                                            : 'text-pm-muted hover:text-pm-text hover:bg-pm-hover'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                            <div className="ml-auto flex items-center gap-2 shrink-0">
                                <span className="text-pm-subtle text-xs">Sort:</span>
                                <span className="text-pm-muted text-xs font-medium">Volume</span>
                            </div>
                        </div>

                        {/* Markets grid */}
                        {filteredMarkets.length === 0 ? (
                            <div className="text-center py-20 text-pm-muted text-sm">
                                {markets.length === 0 ? 'Loading markets...' : 'No markets in this category'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredMarkets.map(market => (
                                    <MarketCard key={market.id} market={market} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Breaking news sidebar */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-20">
                            <h3 className="text-xs font-semibold text-pm-muted uppercase tracking-wider mb-3">
                                Breaking
                            </h3>
                            <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
                                {BREAKING_NEWS.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`px-4 py-3 flex items-start gap-3 ${i < BREAKING_NEWS.length - 1 ? 'border-b border-pm-border' : ''}`}
                                    >
                                        <span className={`font-tabular text-xs font-semibold mt-0.5 shrink-0 ${item.up ? 'text-pm-yes' : 'text-pm-no'}`}>
                                            {item.change}
                                        </span>
                                        <p className="text-xs text-pm-muted leading-relaxed">{item.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className="mt-4 bg-pm-card border border-pm-border rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">Platform</h4>
                                {[
                                    { label: 'Active Markets', value: markets.length.toString() },
                                    { label: 'Total Volume', value: '$' + (markets.reduce((s, m) => s + m.volume, 0) / 1000).toFixed(0) + 'K' },
                                    { label: 'Play Balance', value: user ? `$${user.paperBalance.toFixed(0)}` : '$1,000 free' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-xs text-pm-muted">{label}</span>
                                        <span className="font-tabular text-xs font-medium text-pm-text">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
