import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-pm-bg flex items-center justify-center px-4">
                    <div className="bg-pm-card border border-pm-border rounded-xl p-8 max-w-lg w-full text-center">
                        <p className="text-pm-no font-semibold mb-2">Something went wrong</p>
                        <p className="text-pm-muted text-sm mb-6 font-mono break-all">{this.state.error.message}</p>
                        <button
                            onClick={() => {
                                localStorage.removeItem('auth-storage')
                                window.location.href = '/'
                            }}
                            className="px-4 py-2 bg-pm-blue hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            Clear cache &amp; reload
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
