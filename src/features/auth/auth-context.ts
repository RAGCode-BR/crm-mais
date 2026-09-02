import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured'

export type AuthContextValue = {
  session: Session | null
  user: User | null
  status: AuthStatus
}

export const AuthContext = createContext<AuthContextValue | null>(null)
