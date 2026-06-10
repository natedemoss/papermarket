import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiClient, Market, LeaderboardEntry } from '../lib/api'
import { useAuth } from '../lib/store'
import CategoryIcon from '../components/CategoryIcon'

type ViewMode = 'trending' | 'new' | 'breaking'
type LoadState = 'loading' | 'ready' | 'error'

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

const FALLBACK_TICKER = [
    { change: '+18%', label: 'Fed signals rate pause through Q3', up: true },
    { change: '+12%', label: 'GOP gains Senate seat in early count', up: true },
    { change: '-9%',  label: 'Bitcoin ETF approval delayed again', up: false },
    { change: '+22%', label: 'SpaceX Starship orbital test approved', up: true },
    { change: '-14%', label: 'EU AI Act fast-track vote delayed', up: false },
    { change: '+31%', label: 'Fed rate cut probability rises to 68%', up: true },
    { change: '-7%',  label: 'China GDP growth misses Q1 forecast', up: false },
    { change: '+15%', label: 'Senate AI regulation bill advances', up: true },
]

// Shown in the hero odds panel when the API hasn't responded yet
const PREVIEW_MARKETS = [
    { title: 'Fed cuts rates at the next FOMC meeting', category: 'FINANCE', yesProb: 68, volume: 2400000 },
    { title: 'Bitcoin above $100K by end of year',      category: 'CRYPTO',  yesProb: 41, volume: 5100000 },
    { title: 'SpaceX Starship reaches orbit this quarter', category: 'SCIENCE', yesProb: 77, volume: 890000 },
    { title: 'AI wins a gold medal at the next IMO',    category: 'TECH',    yesProb: 23, volume: 1300000 },
]

function formatVolume(volume: number): string {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}K`
    return `$${volume.toFixed(0)}`
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

function useCountUp(target: number, duration = 1200): number {
    const [value, setValue] = useState(0)
    const started = useRef(false)

    useEffect(() => {
        if (target <= 0 || started.current) return
        started.current = true
        const t0 = performance.now()
        let raf = 0
        const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setValue(Math.round(target * eased))
            if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target, duration])

    return target > 0 ? value : 0
}

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

function MarketThumb({ market, size = 'w-10 h-10' }: { market: Pick<Market, 'imageUrl' | 'category'>; size?: string }) {
    const [failed, setFailed] = useState(false)
    if (!market.imageUrl || failed) {
        return <CategoryIcon category={market.category} />
    }
    return (
        <img
            src={market.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className={`${size} rounded-lg object-cover shrink-0 border border-pm-border bg-pm-surface`}
        />
    )
}

function ProbBar({ prob, delay = 0, height = 'h-1' }: { prob: number; delay?: number; height?: string }) {
    return (
        <div className={`${height} bg-pm-surface rounded-full overflow-hidden`}>
            <div className="h-full rounded-full overflow-hidden" style={{ width: `${prob}%` }}>
                <div
                    className={`h-full w-full rounded-full bar-grow ${prob >= 50 ? 'bg-pm-yes' : 'bg-pm-no'}`}
                    style={{ animationDelay: `${delay}ms` }}
                />
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function HeroChart() {
    const points: [number, number][] = []
    let y = 165
    for (let x = 0; x <= 1200; x += 24) {
        const t = x / 1200
        y = 165 - t * 95 + Math.sin(x * 0.045) * 13 + Math.sin(x * 0.013) * 9
        points.push([x, y])
    }
    const d = points.map(([x, py], i) => `${i === 0 ? 'M' : 'L'}${x},${py.toFixed(1)}`).join(' ')
    const [endX, endY] = points[points.length - 1]

    return (
        <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full h-36 lg:h-52 pointer-events-none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C278" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#00C278" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${d} L1200,200 L0,200 Z`} fill="url(#heroChartFill)" />
            <path d={d} fill="none" stroke="#00C278" strokeOpacity="0.45" strokeWidth="1.5" className="draw-line" />
            <circle cx={endX} cy={endY} r="3" fill="#00C278" opacity="0.9" />
        </svg>
    )
}

function HeroOddsPanel({ markets, live }: { markets: { title: string; category: string; yesProb: number; volume: number; id?: string; imageUrl?: string | null }[]; live: boolean }) {
    return (
        <div className="w-full max-w-md rounded-2xl p-px bg-gradient-to-b from-pm-border via-pm-border to-transparent shadow-2xl shadow-black/60">
            <div className="bg-pm-card/90 backdrop-blur rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-pm-border bg-pm-surface/70">
                    <div className="flex items-center gap-2">
                        {live ? (
                            <>
                                <span className="live-dot" />
                                <span className="text-2xs font-semibold text-pm-yes uppercase tracking-widest">Live odds</span>
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-pm-blue" />
                                <span className="text-2xs font-semibold text-pm-blue uppercase tracking-widest">Sample markets</span>
                            </>
                        )}
                    </div>
                    <span className="text-2xs text-pm-subtle font-medium">Polymarket</span>
                </div>
                <div>
                    {markets.map((m, i) => (
                        <Link
                            key={m.id ?? m.title}
                            to={m.id ? `/markets/${m.id}` : '/register'}
                            className="block px-4 py-3.5 border-b border-pm-border last:border-0 hover:bg-pm-hover transition-colors animate-fade-up"
                            style={{ animationDelay: `${150 + i * 90}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                <MarketThumb market={{ imageUrl: m.imageUrl ?? null, category: m.category }} size="w-9 h-9" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-pm-text truncate">{m.title}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex-1">
                                            <ProbBar prob={m.yesProb} delay={250 + i * 90} height="h-1" />
                                        </div>
                                        <span className="font-tabular text-2xs text-pm-subtle shrink-0">{formatVolume(m.volume)}</span>
                                    </div>
                                </div>
                                <div className={`font-tabular text-base font-bold shrink-0 ${m.yesProb >= 50 ? 'text-pm-yes' : 'text-pm-no'}`}>
                                    {m.yesProb}¢
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="px-4 py-2.5 bg-pm-surface/70 border-t border-pm-border">
                    <p className="text-2xs text-pm-subtle">
                        {live ? 'Odds sync from Polymarket every 10 minutes' : 'Live odds load when the market server is up'}
                    </p>
                </div>
            </div>
        </div>
    )
}

function Hero({ markets, userCount, loadState }: { markets: Market[]; userCount: number | null; loadState: LoadState }) {
    const animatedUsers = useCountUp(userCount ?? 0)
    const panelMarkets = markets.length >= 4
        ? markets.slice(0, 4).map(m => ({ id: m.id, title: m.title, category: m.category, yesProb: m.yesProb, volume: m.volume, imageUrl: m.imageUrl }))
        : PREVIEW_MARKETS

    return (
        <section className="relative overflow-hidden border-b border-pm-border">
            <div className="absolute inset-0 bg-hero-grid" />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="orb top-[-100px] left-[10%] w-[480px] h-[480px] bg-pm-blue/10" />
                <div className="orb orb-delay top-[-60px] right-[8%] w-96 h-96 bg-pm-yes/[0.08]" />
            </div>
            <HeroChart />

            <div className="relative max-w-screen-xl mx-auto px-4 pt-16 pb-24 lg:pt-24 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                {/* Left: copy */}
                <div className="flex-1 max-w-xl text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-pm-card border border-pm-border rounded-full px-3 py-1.5 mb-7 animate-fade-up">
                        <span className="live-dot" />
                        <span className="text-xs text-pm-muted">
                            {markets.length > 0
                                ? <><span className="text-pm-text font-semibold">{markets.length}</span> live markets from Polymarket</>
                                : 'Live odds from Polymarket'}
                        </span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold text-pm-text leading-[1.02] animate-fade-up" style={{ letterSpacing: '-0.04em' }}>
                        Trade on what
                        <br />
                        <span className="text-gradient">happens next.</span>
                    </h1>

                    <p className="text-pm-muted text-base mt-6 max-w-md mx-auto lg:mx-0 leading-relaxed animate-fade-up-slow">
                        Real prediction markets, fake money. You get{' '}
                        <span className="text-pm-text font-semibold">$1,000 in play money</span> to
                        trade on elections, crypto, sports, and tech at live Polymarket odds.
                    </p>

                    <div className="flex items-center justify-center lg:justify-start gap-3 mt-9 animate-fade-up-slow">
                        <Link
                            to="/register"
                            className="px-6 py-3 text-sm font-semibold bg-pm-blue hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-pm-blue/25 hover:shadow-pm-blue/40 hover:-translate-y-0.5"
                        >
                            Start with $1,000 free
                        </Link>
                        <Link
                            to="/markets"
                            className="px-6 py-3 text-sm font-medium text-pm-muted border border-pm-border rounded-lg hover:border-pm-subtle hover:text-pm-text hover:bg-pm-card transition-colors"
                        >
                            Browse markets
                        </Link>
                    </div>

                    {userCount !== null && userCount > 0 && (
                        <p className="text-pm-subtle text-xs mt-7 animate-fade-up-slow">
                            <span className="font-tabular text-pm-text font-semibold">{animatedUsers.toLocaleString()}</span> traders signed up
                        </p>
                    )}
                </div>

                {/* Right: odds panel */}
                <div className="flex-1 flex justify-center lg:justify-end w-full animate-fade-up-slow">
                    {loadState === 'loading' && markets.length === 0 ? (
                        <div className="w-full max-w-md space-y-3">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="shimmer h-16 rounded-xl border border-pm-border" />
                            ))}
                        </div>
                    ) : (
                        <HeroOddsPanel markets={panelMarkets} live={markets.length >= 4} />
                    )}
                </div>
            </div>
        </section>
    )
}

function StatBand({ markets, userCount }: { markets: Market[]; userCount: number | null }) {
    const totalVolume = markets.reduce((s, m) => s + m.volume, 0)
    const animatedMarkets = useCountUp(markets.length)
    const animatedVolume = useCountUp(Math.round(totalVolume / 1000))
    const animatedUsers = useCountUp(userCount ?? 0)

    const stats = markets.length > 0
        ? [
            { value: animatedMarkets.toString(), label: 'Active markets' },
            { value: `$${animatedVolume.toLocaleString()}K`, label: 'Paper volume traded' },
            ...(userCount !== null && userCount > 0 ? [{ value: animatedUsers.toLocaleString(), label: 'Traders' }] : []),
            { value: '$1,000', label: 'Starting balance' },
        ]
        : [
            { value: '$1,000', label: 'Starting balance' },
            { value: '10 min', label: 'Odds sync interval' },
            { value: '7', label: 'Market categories' },
            { value: '$0', label: 'Real money involved' },
        ]

    return (
        <section className="border-b border-pm-border bg-pm-surface/40">
            <div className="max-w-screen-xl mx-auto px-4 py-7 grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-pm-border">
                {stats.map(({ value, label }, i) => (
                    <div key={label} className="text-center animate-fade-up px-4" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="font-tabular text-2xl lg:text-3xl font-bold text-pm-text">{value}</div>
                        <div className="text-2xs text-pm-muted mt-1.5 uppercase tracking-wider">{label}</div>
                    </div>
                ))}
            </div>
        </section>
    )
}

/* ------------------------------------------------------------------ */
/* Market cards                                                        */
/* ------------------------------------------------------------------ */

function MarketCard({ market, index }: { market: Market; index: number }) {
    const yesProb = market.yesProb
    const noProb = 100 - yesProb
    const [labelA, labelB] = getOutcomeLabels(market)

    return (
        <Link
            to={`/markets/${market.id}`}
            className="card-hover bg-pm-card border border-pm-border rounded-xl p-4 flex flex-col gap-3 group animate-fade-up"
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
            <div className="flex items-start gap-3">
                <MarketThumb market={market} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-pm-text leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {market.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <CategoryBadge category={market.category} />
                        <span className="font-tabular text-2xs text-pm-subtle">{formatVolume(market.volume)} vol</span>
                        {market.polymarketSynced && (
                            <span className="flex items-center gap-1">
                                <span className="live-dot" />
                                <span className="text-2xs text-pm-yes font-medium">LIVE</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <ProbBar prob={yesProb} delay={Math.min(index, 12) * 40} />

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
                <MarketThumb market={market} size="w-8 h-8" />
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
                <div className={`text-4xl font-bold mb-1 ${yesProb >= 50 ? 'text-pm-yes' : 'text-pm-no'}`} style={{ fontFamily: 'DM Sans', letterSpacing: '-0.03em' }}>
                    {yesProb}¢
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-tabular text-xs text-pm-muted">{formatVolume(market.volume)} vol</span>
                    <div className="flex-1">
                        <ProbBar prob={yesProb} delay={index * 60} height="h-0.5" />
                    </div>
                </div>
            </div>
        </Link>
    )
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-pm-card border border-pm-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="shimmer w-10 h-10 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="shimmer h-3.5 rounded w-full" />
                            <div className="shimmer h-3.5 rounded w-2/3" />
                        </div>
                    </div>
                    <div className="shimmer h-1 rounded-full" />
                    <div className="flex gap-2">
                        <div className="shimmer h-9 rounded-lg flex-1" />
                        <div className="shimmer h-9 rounded-lg flex-1" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function OfflineState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pm-card border border-pm-border mb-4">
                <svg className="w-5 h-5 text-pm-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m9.9 2.829a5 5 0 010 7.07m-7.072 0a5 5 0 010-7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-pm-text mb-1">The trading floor is offline</h3>
            <p className="text-xs text-pm-muted max-w-sm mx-auto leading-relaxed">
                The market server is waking up or temporarily down. Live odds will be back shortly.
            </p>
            <button
                onClick={onRetry}
                className="mt-4 px-4 py-2 text-xs font-medium text-pm-text bg-pm-card border border-pm-border rounded-lg hover:border-pm-subtle transition-colors"
            >
                Try again
            </button>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Marketing sections (logged out)                                     */
/* ------------------------------------------------------------------ */

const HOW_IT_WORKS = [
    {
        title: 'Sign up free',
        body: 'You get $1,000 in play money the moment you create an account. No credit card.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        accent: 'text-pm-blue bg-pm-blue/10 border-pm-blue/20',
    },
    {
        title: 'Buy YES or NO',
        body: 'Trade real events at live Polymarket odds. Your trades move the price, like a real order book.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        accent: 'text-pm-yes bg-pm-yes/10 border-pm-yes/20',
    },
    {
        title: 'Get paid out',
        body: 'When a market resolves, winning shares pay $1 each. The leaderboard ranks everyone by profit.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        accent: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
]

function HowItWorks() {
    return (
        <section className="border-t border-pm-border bg-pm-surface/30">
            <div className="max-w-screen-xl mx-auto px-4 py-16">
                <h2 className="text-2xl lg:text-3xl font-bold text-pm-text text-center mb-10" style={{ letterSpacing: '-0.025em' }}>
                    How it works
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {HOW_IT_WORKS.map((step, i) => (
                        <div
                            key={step.title}
                            className="relative bg-pm-card border border-pm-border rounded-xl p-6 transition-all hover:-translate-y-1 hover:border-pm-subtle"
                        >
                            <span className="absolute top-5 right-6 font-tabular text-xl font-bold text-pm-subtle select-none">
                                {i + 1}
                            </span>
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border mb-4 ${step.accent}`}>
                                {step.icon}
                            </div>
                            <h3 className="text-sm font-semibold text-pm-text mb-2">{step.title}</h3>
                            <p className="text-xs text-pm-muted leading-relaxed">{step.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function LeaderboardPreview({ entries }: { entries: LeaderboardEntry[] }) {
    if (entries.length === 0) return null

    return (
        <section className="border-t border-pm-border">
            <div className="max-w-screen-xl mx-auto px-4 py-16">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-pm-text" style={{ letterSpacing: '-0.025em' }}>Top traders</h2>
                        <p className="text-sm text-pm-muted mt-1.5">Ranked by total profit.</p>
                    </div>
                    <Link to="/leaderboard" className="text-xs font-medium text-pm-blue hover:text-blue-400 transition-colors">
                        Full leaderboard →
                    </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {entries.slice(0, 3).map((entry, i) => (
                        <div key={entry.user.id} className="bg-pm-card border border-pm-border rounded-xl p-5 flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-pm-surface border border-pm-border flex items-center justify-center text-sm font-bold text-pm-text uppercase">
                                    {entry.user.username.slice(0, 1)}
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-pm-card border border-pm-border flex items-center justify-center font-tabular text-2xs font-bold text-pm-muted">
                                    {i + 1}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-pm-text truncate">{entry.user.username}</p>
                                <p className="text-2xs text-pm-muted mt-0.5">{entry.totalTrades} trades</p>
                            </div>
                            <span className={`font-tabular text-sm font-bold ${entry.pnl >= 0 ? 'text-pm-yes' : 'text-pm-no'}`}>
                                {entry.pnl >= 0 ? '+$' : '-$'}{Math.abs(entry.pnl).toFixed(0)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function CtaBand() {
    return (
        <section className="border-t border-pm-border">
            <div className="max-w-screen-xl mx-auto px-4 py-16">
                <div className="max-w-3xl mx-auto rounded-2xl p-px bg-gradient-to-r from-pm-blue/40 via-pm-yes/30 to-pm-blue/40">
                    <div className="relative bg-pm-surface rounded-2xl px-8 py-12 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-hero-grid" />
                        <div className="relative">
                            <h2 className="text-2xl lg:text-3xl font-bold text-pm-text mb-3" style={{ letterSpacing: '-0.025em' }}>
                                Start trading in 30 seconds
                            </h2>
                            <p className="text-sm text-pm-muted max-w-sm mx-auto mb-8">
                                Free account, $1,000 in play money, live markets.
                            </p>
                            <Link
                                to="/register"
                                className="inline-block px-8 py-3.5 text-sm font-semibold bg-pm-blue hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-pm-blue/25 hover:shadow-pm-blue/40 hover:-translate-y-0.5"
                            >
                                Create free account
                            </Link>
                            <p className="text-2xs text-pm-subtle mt-5">
                                Open source on{' '}
                                <a href="https://github.com/natedemoss/papermarket" target="_blank" rel="noopener noreferrer" className="text-pm-muted hover:text-pm-text underline underline-offset-2 transition-colors">
                                    GitHub
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function Footer() {
    return (
        <footer className="border-t border-pm-border">
            <div className="max-w-screen-xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-2xs text-pm-subtle">
                    PaperMarket · play-money trading on live Polymarket odds · not financial advice
                </p>
                <div className="flex items-center gap-4">
                    <Link to="/markets" className="text-2xs text-pm-muted hover:text-pm-text transition-colors">Markets</Link>
                    <Link to="/leaderboard" className="text-2xs text-pm-muted hover:text-pm-text transition-colors">Leaderboard</Link>
                    <Link to="/info" className="text-2xs text-pm-muted hover:text-pm-text transition-colors">Info</Link>
                    <a href="https://github.com/natedemoss/papermarket" target="_blank" rel="noopener noreferrer" className="text-2xs text-pm-muted hover:text-pm-text transition-colors">GitHub</a>
                </div>
            </div>
        </footer>
    )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
    const { user } = useAuth()
    const [markets, setMarkets] = useState<Market[]>([])
    const [loadState, setLoadState] = useState<LoadState>('loading')
    const [userCount, setUserCount] = useState<number | null>(null)
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
    const [activeCategory, setActiveCategory] = useState('All')
    const [viewMode, setViewMode] = useState<ViewMode>('trending')
    const carouselRef = useRef<HTMLDivElement>(null)

    const activeView = VIEW_TABS.find(v => v.mode === viewMode)!

    const fetchMarkets = () => {
        setLoadState('loading')
        apiClient.getMarkets(undefined, activeView.sort)
            .then(data => {
                setMarkets(data)
                setLoadState('ready')
            })
            .catch(() => setLoadState('error'))
    }

    useEffect(fetchMarkets, [viewMode])

    useEffect(() => {
        apiClient.getStats().then(s => setUserCount(s.userCount)).catch(() => {})
        if (!user) {
            apiClient.getLeaderboard().then(setLeaders).catch(() => {})
        }
    }, [])

    const filteredMarkets = activeCategory === 'All'
        ? markets
        : markets.filter(m => m.category === CATEGORY_MAP[activeCategory])

    const featuredMarkets = markets.slice(0, 7)
    const totalVolume = markets.reduce((s, m) => s + m.volume, 0)

    const tickerItems = markets.length >= 6
        ? markets.slice(0, 10).map(m => ({
            change: `${m.yesProb}¢`,
            label: m.title,
            up: m.yesProb >= 50,
        }))
        : FALLBACK_TICKER

    const scrollCarousel = (dir: 'left' | 'right') => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-pm-bg">
            {/* Ticker tape */}
            <div className="bg-pm-surface border-b border-pm-border overflow-hidden">
                <div className="py-2 ticker-mask">
                    <div className="ticker-track">
                        {[...tickerItems, ...tickerItems].map((item, i) => (
                            <span key={i} className="flex items-center gap-2 px-6 whitespace-nowrap">
                                <span className={`font-tabular text-xs font-semibold ${item.up ? 'text-pm-yes' : 'text-pm-no'}`}>
                                    {item.change}
                                </span>
                                <span className="text-xs text-pm-muted max-w-xs truncate">{item.label}</span>
                                <span className="text-pm-border mx-2">|</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {!user && (
                <>
                    <Hero markets={markets} userCount={userCount} loadState={loadState} />
                    <StatBand markets={markets} userCount={userCount} />
                </>
            )}

            <div className="max-w-screen-xl mx-auto px-4 py-8">
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
                        {loadState === 'loading' && markets.length === 0 ? (
                            <SkeletonGrid />
                        ) : loadState === 'error' && markets.length === 0 ? (
                            <OfflineState onRetry={fetchMarkets} />
                        ) : filteredMarkets.length === 0 ? (
                            <div className="text-center py-20 text-pm-muted text-sm">No markets in this category</div>
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
                            {markets.length > 0 && (
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
                            )}

                            {/* Market pulse */}
                            {markets.length > 0 && (
                                <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-pm-border">
                                        <h4 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">Market Pulse</h4>
                                    </div>
                                    {markets.slice(0, 5).map((m) => (
                                        <Link key={m.id} to={`/markets/${m.id}`} className="px-4 py-2.5 flex items-center gap-3 border-b border-pm-border last:border-0 hover:bg-pm-hover transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-pm-text truncate">{m.title}</p>
                                            </div>
                                            <span className={`font-tabular text-xs font-bold shrink-0 ${m.yesProb >= 50 ? 'text-pm-yes' : 'text-pm-no'}`}>
                                                {m.yesProb}%
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}

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

            {!user && (
                <>
                    <HowItWorks />
                    <LeaderboardPreview entries={leaders} />
                    <CtaBand />
                </>
            )}

            <Footer />
        </div>
    )
}
