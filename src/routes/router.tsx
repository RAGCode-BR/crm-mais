import { createBrowserRouter } from 'react-router-dom'

import { GuestRoute, ProtectedRoute } from '@/features/auth'
import { NotFoundPage } from '@/pages/NotFoundPage'

import {
  ForgotPasswordPage,
  LoginPage,
  OrganizationsPage,
  RegisterPage,
  ResetPasswordPage,
  WorkspacePage,
} from './lazyPages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <WorkspacePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/cadastro',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: '/recuperar-senha',
    element: (
      <GuestRoute>
        <ForgotPasswordPage />
      </GuestRoute>
    ),
  },
  {
    path: '/redefinir-senha',
    element: <ResetPasswordPage />,
  },
  {
    path: '/organizacoes',
    element: (
      <ProtectedRoute>
        <OrganizationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
