import { lazy } from 'react'

export const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)

export const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)

export const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)

export const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)

export const OrganizationsPage = lazy(() =>
  import('@/features/organizations/pages/OrganizationsPage').then((module) => ({
    default: module.OrganizationsPage,
  })),
)

export const WorkspacePage = lazy(() =>
  import('@/features/organizations/pages/WorkspacePage').then((module) => ({
    default: module.WorkspacePage,
  })),
)
