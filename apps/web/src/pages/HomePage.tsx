import { Link } from 'react-router-dom'
import { useAuth } from '../lib/store'

export default function HomePage() {
    const { user } = useAuth()

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
                        PaperMarket
                    </h1>
                    <p className="text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Trade prediction markets with play money. Test your strategy with zero financial risk.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        {!user ? (
                            <>
                                <Link
                                    to="/register"
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                                >
                                    Get Started
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    Sign In
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/markets"
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                                >
                                    Start Trading
                                </Link>
                                <Link
                                    to="/portfolio"
                                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    View Portfolio
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-lg border border-gray-200">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <div className="text-xl font-bold text-blue-600">1</div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Create Account</h3>
                            <p className="text-gray-600">
                                Sign up instantly and receive $1,000 in play money to start trading.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-lg border border-gray-200">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <div className="text-xl font-bold text-blue-600">2</div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Browse Markets</h3>
                            <p className="text-gray-600">
                                Explore hundreds of active markets across multiple categories.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-lg border border-gray-200">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <div className="text-xl font-bold text-blue-600">3</div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Place Trades</h3>
                            <p className="text-gray-600">
                                Trade on market outcomes and compete with traders worldwide.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="text-4xl font-bold text-blue-600 mb-3">1000+</div>
                        <p className="text-gray-600 text-lg">Active Markets</p>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-blue-600 mb-3">50K+</div>
                        <p className="text-gray-600 text-lg">Traders</p>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-blue-600 mb-3">$5M+</div>
                        <p className="text-gray-600 text-lg">Volume Traded</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
