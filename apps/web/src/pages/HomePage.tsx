import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiClient, Market } from '../lib/api'
import { useAuth } from '../lib/store'
import CategoryIcon from '../components/CategoryIcon'

type ViewMode = 'trending' | 'new' | 'breaking'

const VIEW_TABS: { mode: ViewMode; label: string; sort: 'volume' | 'newest' | 'closing_soon' }[] = [
    { mode: 'trending', label: 'Trending', sort: 'volume' },
    { mode: 'new',      label: 'New',      sort: 'newest' },
    { mode: 'breaking', label: 'Breaking', sort: 'closing_soon' },
]

const VIEW_ICONS: Record<ViewMode, JSX.Element> = {
    trending: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    new:      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    breaking: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
}

const CATEGORY_MAP: Record<string, string> = {
    Politics: 'POLITICS', Crypto: 'CRYPTO', Finance: 'FINANCE',
    Tech: 'TECH', Science: 'SCIENCE', Sports: 'SPORTS', Other: 'OTHER',
}

const CATEGORIES = ['All', 'Politics', 'Crypto', 'Finance', 'Tech', 'Science', 'Sports', 'Other']

const TICKER_ITEMS = [
    { change: '+18%', label: 'Fed signals rate pause through Q3', up: true },
    { change: '+12%', label: 'GOP gains Senate seat in early count', up: true },
    { change: '-9%',  label: 'Bitcoin ETF approval delayed again', up: false },
    { change: '+22%', label: 'SpaceX Starship orbital test approved', up: true },
    { change: '-14%', label: 'EU AI Act fast-track vote delayed', up: false },
    { change: '+31%', label: 'Fed rate cut probability rises to 68%', up: true },
    { change: '-7%',  label: 'China GDP growth misses Q1 forecast', up: false },
    { change: '+15%', label: 'Senate AI regulation bill advances', up: true },
]

function CategoryBadge({ category }: { category: string }) {
    const colors: Record<string, string> = {
        POLITICS: 'bg-blue-950 text-blue-400',
        CRYPTO:   'bg-orange-950 text-orange-400',
        FINANCE:  'bg-green-950 text-green-400',
        TECH:     'bg-purple-950 text-purple-400',
        SCIENCE:  'bg-cyan-950 text-cyan-400',
        SPORTS:   'bg-red-950 text-red-400',
        OTHER:    'bg-pm-card text-pm-muted',
    }
    return (
        <span className={`text-2xs font-medium px-2 py-0.5 rounded uppercase tracking-wider ${colors[category] ?? colors.OTHER}`}>
            {category}
        </span>
    )
}

function getOutcomeLabels(market: Market): [string, string] {
    if (!market.outcomes) return ['YES', 'NO']
    try {
        const parsed = JSON.parse(market.outcomes)
        if (Array.isArray(parsed) && parsed.length >= 2) {
            const [a, b] = parsed
            if ((a === 'Yes' || a === 'YES') && (b === 'No' || b === 'NO')) return ['YES', 'NO']
            return [String(a).toUpperCase(), String(b).toUpperCase()]
        }
    } catch {}
    return ['YES', 'NO']
}

function MarketCard({ market, index }: { market: Market; index: number }) {
    const yesProb = market.yesProb
    const noProb = 100 - yesProb
    const [labelA, labelB] = getOutcomeLabels(market)
    const vol = market.volume >= 1000000
        ? `$${(market.volume / 1000000).toFixed(1)}M`
        : market.volume >= 1000
            ? `$${(market.volume / 1000).toFixed(0)}K`
            : `$${market.volume.toFixed(0)}`

    return (
        <Link
            to={`/markets/${market.id}`}
            className="card-hover bg-pm-card border border-pm-border rounded-xl p-4 flex flex-col gap-3 group"
            style={{ animationDelay: `${index * 40}ms` }}
        >
            <div className="flex items-start gap-3">
                <CategoryIcon category={market.category} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-pm-text leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {market.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <CategoryBadge category={market.category} />
                        <span className="font-tabular text-2xs text-pm-subtle">{vol} vol</span>
                        {market.polymarketSynced && (
                            <span className="flex items-center gap-1">
                                <span className="live-dot" />
                                <span className="text-2xs text-pm-yes font-medium">LIVE</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Probability bar */}
            <div className="h-1 bg-pm-surface rounded-full overflow-hidden">
                <div
                    className="h-full bg-pm-yes rounded-full transition-all duration-700"
                    style={{ width: `${yesProb}%` }}
                />
            </div>

            {/* YES / NO */}
            <div className="flex gap-2">
                <div className="flex-1 flex items-center justify-between bg-pm-yes-dim hover:bg-green-900 border border-pm-yes/20 rounded-lg px-3 py-2 transition-colors">
                    <span className="text-pm-yes text-xs font-semibold">{labelA}</span>
                    <span className="font-tabular text-pm-yes font-bold">{yesProb}¢</span>
                </div>
                <div className="flex-1 flex items-center justify-between bg-pm-no-dim hover:bg-red-900 border border-pm-no/20 rounded-lg px-3 py-2 transition-colors">
                    <span className="text-pm-no text-xs font-semibold">{labelB}</span>
                    <span className="font-tabular text-pm-no font-bold">{noProb}¢</span>
                </div>
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
        'from-blue-950/80 to-pm-card',
        'from-purple-950/80 to-pm-card',
        'from-green-950/80 to-pm-card',
        'from-orange-950/80 to-pm-card',
        'from-red-950/80 to-pm-card',
        'from-cyan-950/80 to-pm-card',
        'from-indigo-950/80 to-pm-card',
    ]

    return (
        <Link
            to={`/markets/${market.id}`}
            className={`featured-glow card-hover flex-shrink-0 w-64 bg-gradient-to-br ${gradients[index % gradients.length]} border border-pm-border rounded-xl p-4 flex flex-col gap-3`}
        >
            <div className="flex items-center gap-2">
                <CategoryBadge category={market.category} />
                {market.polymarketSynced && (
                    <span className="flex items-center gap-1 ml-auto">
                        <span className="live-dot" />
                        <span className="text-2xs text-pm-yes font-medium">LIVE</span>
                    </span>
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
                        <div className="h-full bg-pm-yes transition-all duration-700" style={{ width: `${yesProb}%` }} />
                    </div>
                </div>
            </div>
        </Link>
    )
}

function StatCounter({ value, label, prefix = '' }: { value: string; label: string; prefix?: string }) {
    return (
        <div className="text-center">
            <div className="font-tabular text-2xl font-bold text-pm-text">{prefix}{value}</div>
            <div className="text-xs text-pm-muted mt-0.5">{label}</div>
        </div>
    )
}

export default function HomePage() {
    const { user } = useAuth()
    const [markets, setMarkets] = useState<Market[]>([])
    const [userCount, setUserCount] = useState<number | null>(null)
    const [activeCategory, setActiveCategory] = useState('All')
    const [viewMode, setViewMode] = useState<ViewMode>('trending')
    const carouselRef = useRef<HTMLDivElement>(null)

    const activeView = VIEW_TABS.find(v => v.mode === viewMode)!

    useEffect(() => {
        apiClient.getMarkets(undefined, activeView.sort).then(setMarkets).catch(() => {})
    }, [viewMode])

    useEffect(() => {
        apiClient.getStats().then(s => setUserCount(s.userCount)).catch(() => {})
    }, [])

    const filteredMarkets = activeCategory === 'All'
        ? markets
        : markets.filter(m => m.category === CATEGORY_MAP[activeCategory])

    const featuredMarkets = markets.slice(0, 7)

    const scrollCarousel = (dir: 'left' | 'right') => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
        }
    }

    const totalVolume = markets.reduce((s, m) => s + m.volume, 0)
    const liveCount = markets.filter(m => m.polymarketSynced).length

    return (
        <div className="min-h-screen bg-pm-bg">
            {/* Ticker tape */}
            <div className="bg-pm-surface border-b border-pm-border overflow-hidden">
                <div className="py-2">
                    <div className="ticker-track">
                        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                            <span key={i} className="flex items-center gap-2 px-6 whitespace-nowrap">
                                <span className={`font-tabular text-xs font-semibold ${item.up ? 'text-pm-yes' : 'text-pm-no'}`}>
                                    {item.change}
                                </span>
                                <span className="text-xs text-pm-muted">{item.label}</span>
                                <span className="text-pm-border mx-2">|</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hero banner */}
            {!user && (
                <div className="relative overflow-hidden border-b border-pm-border">
                    {/* Animated background gradient blobs */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pm-blue/5 rounded-full blur-3xl" />
                        <div className="absolute top-0 right-1/4 w-80 h-80 bg-pm-yes/4 rounded-full blur-3xl" />
                    </div>
                    <div className="relative max-w-screen-xl mx-auto px-4 py-12 flex items-center justify-between gap-8">
                        <div className="animate-fade-up">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="live-dot" />
                                <span className="text-xs text-pm-yes font-medium">{markets.length} active markets from Polymarket</span>
                            </div>
                            <h1 className="text-4xl font-bold text-pm-text mb-3 leading-tight" style={{ letterSpacing: '-0.03em' }}>
                                Trade what you know.
                            </h1>
                            <p className="text-pm-muted text-sm max-w-md leading-relaxed">
                                Predict real-world outcomes with play money. No risk, pure strategy. Compete with traders on global events.
                            </p>
                            {userCount !== null && (
                                <p className="text-pm-subtle text-xs mt-3">
                                    Join <span className="text-pm-text font-semibold">{userCount.toLocaleString()}</span> traders already on the platform
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-4 shrink-0 animate-fade-up-slow">
                            {/* Mini stat strip */}
                            <div className="hidden md:flex items-center gap-8 bg-pm-card border border-pm-border rounded-xl px-6 py-4">
                                <StatCounter value={markets.length.toString()} label="Active Markets" />
                                <div className="w-px h-8 bg-pm-border" />
                                <StatCounter value={`$${(totalVolume / 1000).toFixed(0)}K`} label="Total Volume" />
                                <div className="w-px h-8 bg-pm-border" />
                                {userCount !== null && <>
                                    <StatCounter value={userCount.toLocaleString()} label="Traders" />
                                    <div className="w-px h-8 bg-pm-border" />
                                </>}
                                <StatCounter value="$1,000" label="Free Play Money" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="px-4 py-2.5 text-sm text-pm-muted border border-pm-border rounded-lg hover:border-pm-subtle hover:text-pm-text transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2.5 text-sm font-semibold bg-pm-blue hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-pm-blue/20"
                                >
                                    Start trading free
                                </Link>
                            </div>
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
                                    <h2 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">Featured</h2>
                                    <div className="flex gap-1">
                                        <button onClick={() => scrollCarousel('left')} className="p-1.5 rounded-lg text-pm-muted hover:text-pm-text hover:bg-pm-card border border-transparent hover:border-pm-border transition-all">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={() => scrollCarousel('right')} className="p-1.5 rounded-lg text-pm-muted hover:text-pm-text hover:bg-pm-card border border-transparent hover:border-pm-border transition-all">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div ref={carouselRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                    {featuredMarkets.map((m, i) => (
                                        <FeaturedCard key={m.id} market={m} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* View mode tabs */}
                        <div className="flex items-center gap-1 mb-1 border-b border-pm-border pb-0">
                            {VIEW_TABS.map(tab => {
                                const isActive = viewMode === tab.mode
                                const activeStyle =
                                    tab.mode === 'trending' ? 'text-amber-400 border-amber-400' :
                                    tab.mode === 'new'      ? 'text-pm-blue border-pm-blue' :
                                                              'text-pm-no border-pm-no'
                                return (
                                    <button
                                        key={tab.mode}
                                        onClick={() => setViewMode(tab.mode)}
                                        className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
                                            isActive ? activeStyle : 'text-pm-muted border-transparent hover:text-pm-text'
                                        }`}
                                    >
                                        {VIEW_ICONS[tab.mode]}
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Category sub-tabs */}
                        <div className="flex items-center gap-0.5 mb-5 overflow-x-auto no-scrollbar border-b border-pm-border pb-0">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3.5 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-all ${
                                        activeCategory === cat
                                            ? 'border-pm-blue text-pm-text'
                                            : 'border-transparent text-pm-subtle hover:text-pm-muted'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Markets grid */}
                        {filteredMarkets.length === 0 ? (
                            <div className="text-center py-20 text-pm-muted text-sm">
                                {markets.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-6 h-6 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
                                        <span>Loading markets...</span>
                                    </div>
                                ) : 'No markets in this category'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredMarkets.map((market, i) => (
                                    <MarketCard key={market.id} market={market} index={i} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-20 space-y-4">
                            {/* Stats */}
                            <div className="bg-pm-card border border-pm-border rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">Platform</h4>
                                {[
                                    { label: 'Active Markets', value: markets.length.toString() },
                                    { label: 'Total Volume', value: '$' + (totalVolume / 1000).toFixed(0) + 'K' },
                                    ...(userCount !== null ? [{ label: 'Traders', value: userCount.toLocaleString() }] : []),
                                    { label: 'Play Balance', value: user ? `$${Number(user.paperBalance).toFixed(0)}` : '$1,000 free' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-xs text-pm-muted">{label}</span>
                                        <span className="font-tabular text-xs font-medium text-pm-text">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Market pulse */}
                            <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-pm-border">
                                    <h4 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">Market Pulse</h4>
                                </div>
                                {markets.slice(0, 5).map((m) => (
                                    <div key={m.id} className="px-4 py-2.5 flex items-center gap-3 border-b border-pm-border last:border-0 hover:bg-pm-hover transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-pm-text truncate">{m.title}</p>
                                        </div>
                                        <span className={`font-tabular text-xs font-bold shrink-0 ${m.yesProb >= 50 ? 'text-pm-yes' : 'text-pm-no'}`}>
                                            {m.yesProb}%
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* About link */}
                            <Link
                                to="/info"
                                className="flex items-center justify-between w-full bg-pm-blue/10 border border-pm-blue/20 hover:border-pm-blue/40 rounded-xl px-4 py-3 transition-colors group"
                            >
                                <div>
                                    <p className="text-xs font-semibold text-pm-blue">About PaperMarket</p>
                                    <p className="text-2xs text-pm-muted mt-0.5">Data sourced from Polymarket</p>
                                </div>
                                <svg className="w-4 h-4 text-pm-blue group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
