import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient, Market } from '../lib/api'
import { useMarkets } from '../lib/store'

export default function MarketsPage() {
    const { markets, setMarkets, isLoading, setLoading, error, setError } = useMarkets()
    const [category, setCategory] = useState<string>('')
    const [sort, setSort] = useState<'volume' | 'newest' | 'closing_soon'>('volume')

    useEffect(() => {
        const fetchMarkets = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await apiClient.getMarkets(category || undefined, sort)
                setMarkets(data)
            } catch (err) {
                setError('Failed to load markets')
            } finally {
                setLoading(false)
            }
        }

        fetchMarkets()
    }, [category, sort, setMarkets, setLoading, setError])

    const categories = ['FINANCE', 'CRYPTO', 'TECH', 'SCIENCE', 'POLITICS', 'SPORTS', 'OTHER']

    const getProbabilityColor = (prob: number) => {
        if (prob > 70) return 'text-green-500'
        if (prob > 50) return 'text-blue-500'
        if (prob > 30) return 'text-orange-500'
        return 'text-red-500'
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">Markets</h1>

                {/* Filters */}
                <div className="flex gap-4 flex-wrap">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as any)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="volume">Volume</option>
                        <option value="newest">Newest</option>
                        <option value="closing_soon">Closing Soon</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-8">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-16">
                    <div className="inline-block">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-gray-600 mt-4">Loading markets...</p>
                </div>
            ) : markets.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-600 text-lg">No markets available</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {markets.map((market: Market) => (
                        <Link
                            key={market.id}
                            to={`/markets/${market.id}`}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition"
                        >
                            <div className="flex justify-between items-start gap-6">
                                {/* Left: Market Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">{market.title}</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                                            {market.category}
                                        </span>
                                        {market.polymarketSynced && (
                                            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                                                Synced
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Odds & Stats */}
                                <div className="flex gap-8 items-start">
                                    <div className="text-right">
                                        <div className={`text-3xl font-bold ${getProbabilityColor(market.yesProb)}`}>
                                            {market.yesProb}%
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">YES</p>
                                    </div>

                                    <div className="text-right text-sm text-gray-600">
                                        <p>Vol: ${market.volume.toFixed(2)}</p>
                                        {market.closesAt && (
                                            <p className="mt-2">
                                                {new Date(market.closesAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
