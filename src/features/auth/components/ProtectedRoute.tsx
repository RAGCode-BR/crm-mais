import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../useAuth'
import { AuthLoading } from './AuthLoading'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <AuthLoading />

  if (status !== 'authenticated') {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return children
}
