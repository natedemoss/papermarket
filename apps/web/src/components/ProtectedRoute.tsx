import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/store'

interface ProtectedRouteProps {
    children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { accessToken } = useAuth()

    if (!accessToken) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
