import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'

import { AuthLoading } from '@/features/auth/components/AuthLoading'
import { router } from '@/routes/router'

export function App() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
