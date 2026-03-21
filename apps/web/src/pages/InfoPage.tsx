import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-pm-blue/15 border border-pm-blue/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-pm-blue font-bold text-xs">{number}</span>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-pm-text mb-1">{title}</h3>
                <p className="text-sm text-pm-muted leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}

function Faq({ q, a }: { q: string; a: string }) {
    return (
        <div className="border-b border-pm-border pb-5 last:border-0 last:pb-0">
            <h3 className="text-sm font-semibold text-pm-text mb-2">{q}</h3>
            <p className="text-sm text-pm-muted leading-relaxed">{a}</p>
        </div>
    )
}

export default function InfoPage() {
    return (
        <div className="min-h-screen bg-pm-bg">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-pm-border">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/3 w-96 h-96 bg-pm-blue/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-pm-yes/4 rounded-full blur-3xl" />
                </div>
                <div className="relative max-w-screen-xl mx-auto px-4 py-16 text-center">
                    <div className="flex justify-center mb-6">
                        <Logo size={56} />
                    </div>
                    <h1 className="text-4xl font-bold text-pm-text mb-4" style={{ letterSpacing: '-0.03em' }}>
                        About PaperMarket
                    </h1>
                    <p className="text-pm-muted max-w-xl mx-auto leading-relaxed">
                        A paper-trading prediction market platform powered by real-world data from Polymarket.
                        Trade with play money, sharpen your forecasting skills, compete on the leaderboard.
                    </p>
                </div>
            </div>

            <div className="max-w-screen-lg mx-auto px-4 py-12 space-y-12">

                {/* Data source */}
                <section className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-pm-yes/10 border border-pm-yes/20 rounded-full px-3 py-1 mb-4">
                            <span className="live-dot" />
                            <span className="text-xs text-pm-yes font-medium">Live Data</span>
                        </div>
                        <h2 className="text-2xl font-bold text-pm-text mb-4" style={{ letterSpacing: '-0.02em' }}>
                            Powered by Polymarket
                        </h2>
                        <p className="text-pm-muted leading-relaxed mb-4">
                            Market probabilities and titles are synced directly from <strong className="text-pm-text">Polymarket</strong> — the world's largest prediction market platform with millions in real-money trading volume.
                        </p>
                        <p className="text-pm-muted leading-relaxed">
                            PaperMarket pulls live market data every 10 minutes so the probabilities you see reflect what real traders are betting with real money. You get the same information edge — without any financial risk.
                        </p>
                    </div>
                    <div className="bg-pm-card border border-pm-border rounded-2xl p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-pm-yes/10 border border-pm-yes/20 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-pm-yes" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-pm-text">Real probabilities</p>
                                <p className="text-xs text-pm-muted mt-0.5">Synced from Polymarket's live markets every 10 minutes</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-pm-blue/10 border border-pm-blue/20 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-pm-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-pm-text">Global events coverage</p>
                                <p className="text-xs text-pm-muted mt-0.5">Politics, crypto, finance, tech, science, sports</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-950 border border-orange-900/30 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-pm-text">Zero financial risk</p>
                                <p className="text-xs text-pm-muted mt-0.5">All trading uses $1,000 in play money — no real currency</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section>
                    <h2 className="text-xl font-bold text-pm-text mb-6" style={{ letterSpacing: '-0.02em' }}>How it works</h2>
                    <div className="bg-pm-card border border-pm-border rounded-2xl p-6 space-y-6">
                        <Step
                            number="1"
                            title="Get your free play money"
                            desc="Sign up and receive $1,000 in paper money instantly. No credit card, no deposit, no real money ever involved."
                        />
                        <Step
                            number="2"
                            title="Browse and trade markets"
                            desc="Browse hundreds of markets on politics, crypto, finance, tech, and more. Buy YES or NO shares based on your view of the outcome."
                        />
                        <Step
                            number="3"
                            title="Watch the price move"
                            desc="As new information emerges, market probabilities shift — just like Polymarket. Your positions gain or lose value in real time."
                        />
                        <Step
                            number="4"
                            title="Compete on the leaderboard"
                            desc="PnL is calculated from your positions vs current market prices. Climb the leaderboard by being right more often than everyone else."
                        />
                    </div>
                </section>

                {/* How prices work */}
                <section>
                    <h2 className="text-xl font-bold text-pm-text mb-6" style={{ letterSpacing: '-0.02em' }}>How prices work</h2>
                    <div className="bg-pm-card border border-pm-border rounded-2xl p-6 space-y-4">
                        <p className="text-sm text-pm-muted leading-relaxed">
                            Every market has a YES price and a NO price that always add up to 100¢. A YES price of <span className="text-pm-text font-medium">72¢</span> means the market thinks there's a <span className="text-pm-yes font-medium">72% chance</span> the event happens.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="bg-pm-yes-dim border border-pm-yes/20 rounded-xl p-4">
                                <div className="text-pm-yes font-bold text-lg font-tabular mb-1">YES — 72¢</div>
                                <p className="text-xs text-pm-muted">Buying YES means you think the event is more likely to happen. You profit when the probability rises or the event resolves YES.</p>
                            </div>
                            <div className="bg-pm-no-dim border border-pm-no/20 rounded-xl p-4">
                                <div className="text-pm-no font-bold text-lg font-tabular mb-1">NO — 28¢</div>
                                <p className="text-xs text-pm-muted">Buying NO means you think the event is less likely. You profit when the probability falls or the event resolves NO.</p>
                            </div>
                        </div>
                        <p className="text-xs text-pm-subtle">
                            Prices shift when trades are placed. Large YES bets push the probability up; large NO bets push it down — just like a real market.
                        </p>
                    </div>
                </section>

                {/* FAQ */}
                <section>
                    <h2 className="text-xl font-bold text-pm-text mb-6" style={{ letterSpacing: '-0.02em' }}>FAQ</h2>
                    <div className="bg-pm-card border border-pm-border rounded-2xl p-6 space-y-5">
                        <Faq
                            q="Is this real money?"
                            a="No. PaperMarket uses entirely fictional play money. You cannot deposit or withdraw real currency. It is a simulation for educational and entertainment purposes."
                        />
                        <Faq
                            q="Where does the market data come from?"
                            a="Market titles, probabilities, and categories are pulled from Polymarket via their Gamma API. PaperMarket syncs every 10 minutes. PaperMarket is not affiliated with Polymarket."
                        />
                        <Faq
                            q="How is my P&L calculated?"
                            a="Your P&L is the current estimated value of all your positions minus what you paid for them. When markets resolve, your payout is based on the outcome — YES shareholders receive $1 per share if the event happens, NO shareholders receive $1 per share if it doesn't."
                        />
                        <Faq
                            q="Can I reset my balance?"
                            a="Not currently. Your balance reflects your real trading decisions. A future update may allow requesting a reset once your balance drops below a threshold."
                        />
                        <Faq
                            q="How are trades priced?"
                            a="When you buy YES at 65¢, your $10 trade buys approximately 15.4 shares. Each trade also shifts the market probability slightly, simulating real market impact."
                        />
                    </div>
                </section>

                {/* Open source */}
                <section>
                    <a
                        href="https://github.com/natedemoss/papermarket"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-pm-card border border-pm-border hover:border-pm-subtle rounded-2xl p-6 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-pm-surface border border-pm-border flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-pm-text" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-pm-text">Open Source</p>
                                <p className="text-xs text-pm-muted mt-0.5">View the source code on GitHub — natedemoss/papermarket</p>
                            </div>
                        </div>
                        <svg className="w-4 h-4 text-pm-subtle group-hover:text-pm-muted group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </section>

                {/* CTA */}
                <section className="bg-pm-blue/10 border border-pm-blue/20 rounded-2xl p-8 text-center">
                    <h2 className="text-xl font-bold text-pm-text mb-2">Ready to start trading?</h2>
                    <p className="text-pm-muted text-sm mb-6">Get $1,000 in free play money and start predicting today.</p>
                    <div className="flex items-center justify-center gap-3">
                        <Link
                            to="/register"
                            className="px-6 py-2.5 bg-pm-blue hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-pm-blue/20"
                        >
                            Create free account
                        </Link>
                        <Link
                            to="/markets"
                            className="px-6 py-2.5 border border-pm-border hover:border-pm-subtle text-pm-muted hover:text-pm-text text-sm rounded-lg transition-colors"
                        >
                            Browse markets
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    )
}
