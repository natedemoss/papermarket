import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/store'
import { apiClient } from '../lib/api'

export default function OAuthCallbackPage() {
    const navigate = useNavigate()
    const { setUser, setTokens } = useAuth()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const accessToken = params.get('accessToken')
        const refreshToken = params.get('refreshToken')
        const error = params.get('error')

        if (error || !accessToken || !refreshToken) {
            navigate('/login?error=oauth_failed')
            return
        }

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setTokens(accessToken, refreshToken)

        apiClient.getMe()
            .then(user => {
                setUser(user)
                navigate('/markets')
            })
            .catch(() => navigate('/login?error=oauth_failed'))
    }, [navigate, setUser, setTokens])

    return (
        <div className="min-h-screen bg-pm-bg flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block w-6 h-6 border-2 border-pm-border border-t-pm-blue rounded-full animate-spin mb-3" />
                <p className="text-pm-muted text-sm">Signing you in...</p>
            </div>
        </div>
    )
}
