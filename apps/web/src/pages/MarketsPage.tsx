import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiClient, Market } from '../lib/api'
import { useMarkets } from '../lib/store'
import CategoryIcon from '../components/CategoryIcon'

// ─── View Modes ───────────────────────────────────────────────────────────────

type ViewMode = 'trending' | 'new' | 'breaking' | 'resolved'

const VIEW_TABS: { mode: ViewMode; label: string; sort: 'volume' | 'newest' | 'closing_soon'; desc: string }[] = [
    { mode: 'trending',  label: 'Trending',  sort: 'volume',       desc: 'Highest trading volume' },
    { mode: 'new',       label: 'New',       sort: 'newest',       desc: 'Recently added markets' },
    { mode: 'breaking',  label: 'Breaking',  sort: 'closing_soon', desc: 'Resolving within days' },
    { mode: 'resolved',  label: 'Resolved',  sort: 'volume',       desc: 'Settled markets' },
]

const VIEW_STYLES: Record<ViewMode, { active: string; dot: string }> = {
    trending: { active: 'text-amber-400 border-amber-400 bg-amber-400/8', dot: 'bg-amber-400' },
    new:      { active: 'text-pm-blue border-pm-blue bg-pm-blue/8',       dot: 'bg-pm-blue' },
    breaking: { active: 'text-pm-no border-pm-no bg-pm-no/8',             dot: 'bg-pm-no' },
    resolved: { active: 'text-pm-muted border-pm-subtle bg-pm-surface',   dot: 'bg-pm-muted' },
}

// ─── Category Tabs ────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
    { label: 'All',      value: '',          icon: '◈' },
    { label: 'Politics', value: 'POLITICS',  icon: '⬡' },
    { label: 'Crypto',   value: 'CRYPTO',    icon: '◆' },
    { label: 'Finance',  value: 'FINANCE',   icon: '◇' },
    { label: 'Tech',     value: 'TECH',      icon: '◉' },
    { label: 'Science',  value: 'SCIENCE',   icon: '◎' },
    { label: 'Sports',   value: 'SPORTS',    icon: '◈' },
    { label: 'Other',    value: 'OTHER',     icon: '○' },
]

// ─── Outcome Labels ───────────────────────────────────────────────────────────

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

// ─── Market Row ───────────────────────────────────────────────────────────────

function MarketRow({ market, rank }: { market: Market; rank?: number }) {
    const yesProb = market.yesProb
    const noProb = 100 - yesProb
    const [labelA, labelB] = getOutcomeLabels(market)
    const vol = market.volume >= 1000000
        ? `$${(market.volume / 1000000).toFixed(1)}M`
        : market.volume >= 1000
            ? `$${(market.volume / 1000).toFixed(0)}K`
            : `$${market.volume.toFixed(0)}`

    const daysLeft = market.closesAt
        ? Math.ceil((new Date(market.closesAt).getTime() - Date.now()) / 86400000)
        : null

    const isUrgent = daysLeft !== null && daysLeft <= 3

    return (
        <Link
            to={`/markets/${market.id}`}
            className="bg-pm-card border border-pm-border rounded-xl p-4 hover:border-pm-subtle transition-all duration-150 flex items-center gap-4 group"
        >
            {/* Rank */}
            {rank !== undefined && (
                <span className="font-tabular text-xs text-pm-subtle w-5 text-right shrink-0">
                    {rank}
                </span>
            )}

            {/* Icon */}
            <CategoryIcon category={market.category} />

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-pm-text group-hover:text-white transition-colors line-clamp-1">
                    {market.title}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="font-tabular text-xs text-pm-subtle">{vol} vol</span>
                    {market.closesAt && (
                        <span className={`font-tabular text-xs ${isUrgent ? 'text-pm-no font-semibold' : 'text-pm-subtle'}`}>
                            {isUrgent && daysLeft === 0
                                ? 'Closes today'
                                : isUrgent
                                    ? `${daysLeft}d left`
                                    : `Closes ${new Date(market.closesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            }
                        </span>
                    )}
                    {market.resolvedAt && (
                        <span className="text-xs bg-pm-surface border border-pm-border text-pm-muted px-1.5 py-0.5 rounded font-medium">
                            RESOLVED
                        </span>
                    )}
                    {market.polymarketSynced && !market.resolvedAt && (
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-pm-yes animate-pulse" />
                            <span className="text-xs text-pm-yes font-medium">LIVE</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Probability bar */}
            <div className="hidden sm:block w-24 shrink-0">
                <div className="h-1.5 bg-pm-surface rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-gradient-to-r from-pm-yes to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${yesProb}%` }} />
                </div>
                <div className="flex justify-between font-tabular text-2xs text-pm-subtle">
                    <span className="text-pm-yes">{yesProb}%</span>
                    <span className="text-pm-no">{noProb}%</span>
                </div>
            </div>

            {/* Outcome buttons */}
            <div className="flex gap-1.5 shrink-0">
                <div className="flex flex-col items-center bg-pm-yes-dim hover:bg-green-900 border border-pm-yes/20 rounded-lg px-3 py-1.5 transition-colors min-w-[56px]">
                    <span className="text-pm-yes text-2xs font-semibold leading-none mb-0.5">{labelA}</span>
                    <span className="font-tabular text-pm-yes font-bold text-sm">{yesProb}¢</span>
                </div>
                <div className="flex flex-col items-center bg-pm-no-dim hover:bg-red-900 border border-pm-no/20 rounded-lg px-3 py-1.5 transition-colors min-w-[56px]">
                    <span className="text-pm-no text-2xs font-semibold leading-none mb-0.5">{labelB}</span>
                    <span className="font-tabular text-pm-no font-bold text-sm">{noProb}¢</span>
                </div>
            </div>
        </Link>
    )
}

// ─── View Mode Icon ───────────────────────────────────────────────────────────

function ViewIcon({ mode }: { mode: ViewMode }) {
    if (mode === 'trending') return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
    )
    if (mode === 'new') return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    )
    if (mode === 'breaking') return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    )
    return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketsPage() {
    const { markets, setMarkets, isLoading, setLoading, error, setError } = useMarkets()
    const [viewMode, setViewMode] = useState<ViewMode>('trending')
    const [category, setCategory] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()
    const searchQuery = searchParams.get('q') ?? ''

    const activeView = VIEW_TABS.find(v => v.mode === viewMode)!

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const isResolved = viewMode === 'resolved'
                const data = await apiClient.getMarkets(
                    category || undefined,
                    isResolved ? 'volume' : activeView.sort,
                    isResolved
                )
                setMarkets(data)
            } catch {
                setError('Failed to load markets')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [category, viewMode]) // eslint-disable-line

    const filtered = searchQuery
        ? markets.filter((m: Market) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : markets

    return (
        <div className="min-h-screen bg-pm-bg">
            {/* View Mode Tab Bar */}
            <div className="border-b border-pm-border bg-pm-surface">
                <div className="max-w-screen-xl mx-auto px-4">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {VIEW_TABS.map(tab => {
                            const styles = VIEW_STYLES[tab.mode]
                            const isActive = viewMode === tab.mode
                            return (
                                <button
                                    key={tab.mode}
                                    onClick={() => setViewMode(tab.mode)}
                                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
                                        isActive
                                            ? styles.active
                                            : 'text-pm-muted border-transparent hover:text-pm-text'
                                    }`}
                                >
                                    <ViewIcon mode={tab.mode} />
                                    {tab.label}
                                    {tab.mode === 'trending' && (
                                        <span className={`text-2xs px-1.5 py-0.5 rounded font-medium ${isActive ? 'bg-amber-400/15 text-amber-400' : 'bg-pm-surface text-pm-subtle'}`}>
                                            HOT
                                        </span>
                                    )}
                                    {tab.mode === 'breaking' && (
                                        <span className={`text-2xs px-1.5 py-0.5 rounded font-medium ${isActive ? 'bg-pm-no/15 text-pm-no' : 'bg-pm-surface text-pm-subtle'}`}>
                                            LIVE
                                        </span>
                                    )}
                                </button>
                            )
                        })}

                        {/* Market count */}
                        <div className="ml-auto shrink-0 flex items-center gap-2 py-3">
                            <span className="font-tabular text-xs text-pm-subtle">{filtered.length} markets</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Sub-tabs */}
            <div className="border-b border-pm-border bg-pm-bg">
                <div className="max-w-screen-xl mx-auto px-4">
                    <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
                        {CATEGORY_TABS.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setCategory(tab.value)}
                                className={`px-3.5 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-all ${
                                    category === tab.value
                                        ? 'border-pm-blue text-pm-text'
                                        : 'border-transparent text-pm-subtle hover:text-pm-muted'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 py-5">
                {/* View mode description + search result */}
                <div className="flex items-center justify-between mb-4">
                    {searchQuery ? (
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-pm-muted">
                                Results for <span className="text-pm-text font-medium">"{searchQuery}"</span>
                            </p>
                            <button
                                onClick={() => setSearchParams({})}
                                className="text-xs text-pm-subtle hover:text-pm-muted transition-colors underline"
                            >
                                Clear
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-pm-subtle">{activeView.desc}</p>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-950 border border-pm-no/30 text-pm-no px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* List */}
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-6 h-6 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin" />
                        <p className="text-pm-muted text-sm mt-3">Loading markets...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-pm-muted text-sm">
                        {searchQuery ? `No markets matching "${searchQuery}"` : 'No markets in this view'}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filtered.map((market: Market, i) => (
                            <MarketRow
                                key={market.id}
                                market={market}
                                rank={viewMode === 'trending' ? i + 1 : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
