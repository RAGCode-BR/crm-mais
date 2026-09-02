import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../useAuth'
import { AuthLoading } from './AuthLoading'

export function GuestRoute({ children }: PropsWithChildren) {
  const { status } = useAuth()

  if (status === 'loading') return <AuthLoading />
  if (status === 'authenticated') return <Navigate replace to="/" />

  return children
}
