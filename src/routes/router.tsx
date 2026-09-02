import { createBrowserRouter } from 'react-router-dom'

import { GuestRoute, ProtectedRoute } from '@/features/auth'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AppShell } from '@/layouts/AppShell'

import {
  ForgotPasswordPage,
  CompaniesPage,
  CompanyDetailsPage,
  ContactDetailsPage,
  ContactsPage,
  EditCompanyPage,
  EditContactPage,
  EditLeadPage,
  EditOpportunityPage,
  EditPipelinePage,
  LeadDetailsPage,
  LeadsPage,
  LoginPage,
  NewCompanyPage,
  NewContactPage,
  NewLeadPage,
  NewOpportunityPage,
  NewPipelinePage,
  OpportunitiesPage,
  OpportunityDetailsPage,
  PipelinesPage,
  OrganizationsPage,
  RegisterPage,
  ResetPasswordPage,
  WorkspacePage,
} from './lazyPages'

export const router = createBrowserRouter([
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/empresas', element: <CompaniesPage /> },
      { path: '/empresas/nova', element: <NewCompanyPage /> },
      { path: '/empresas/:companyId', element: <CompanyDetailsPage /> },
      { path: '/empresas/:companyId/editar', element: <EditCompanyPage /> },
      { path: '/contatos', element: <ContactsPage /> },
      { path: '/contatos/novo', element: <NewContactPage /> },
      { path: '/contatos/:contactId', element: <ContactDetailsPage /> },
      { path: '/contatos/:contactId/editar', element: <EditContactPage /> },
      { path: '/leads', element: <LeadsPage /> },
      { path: '/leads/novo', element: <NewLeadPage /> },
      { path: '/leads/:leadId', element: <LeadDetailsPage /> },
      { path: '/leads/:leadId/editar', element: <EditLeadPage /> },
      { path: '/oportunidades', element: <OpportunitiesPage /> },
      { path: '/oportunidades/nova', element: <NewOpportunityPage /> },
      { path: '/oportunidades/:opportunityId', element: <OpportunityDetailsPage /> },
      { path: '/oportunidades/:opportunityId/editar', element: <EditOpportunityPage /> },
      { path: '/pipelines', element: <PipelinesPage /> },
      { path: '/pipelines/novo', element: <NewPipelinePage /> },
      { path: '/pipelines/:pipelineId/editar', element: <EditPipelinePage /> },
    ],
  },
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
