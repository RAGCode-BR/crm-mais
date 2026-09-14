import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../useAuth'
import { AuthLoading } from './AuthLoading'
import { AuthUnconfigured } from './AuthUnconfigured'

export function GuestRoute({ children }: PropsWithChildren) {
  const { status } = useAuth()

  if (status === 'loading') return <AuthLoading />
  if (status === 'unconfigured') return <AuthUnconfigured />
  if (status === 'authenticated') return <Navigate replace to="/" />

  return children
}
