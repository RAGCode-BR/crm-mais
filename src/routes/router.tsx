import { createBrowserRouter } from 'react-router-dom'

import { FoundationPage } from '@/pages/FoundationPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <FoundationPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
