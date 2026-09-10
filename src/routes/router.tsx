import { createBrowserRouter } from 'react-router-dom'

import { GuestRoute, ProtectedRoute } from '@/features/auth'
import { AppShell } from '@/layouts/AppShell'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'

import {
  ForgotPasswordPage,
  ActivityDetailsPage,
  DashboardPage,
  CompaniesPage,
  CompanyDetailsPage,
  ContactDetailsPage,
  ContactsPage,
  EditCompanyPage,
  EditContactPage,
  EditLeadPage,
  EditOpportunityPage,
  EditPipelinePage,
  EditTaskPage,
  LeadDetailsPage,
  LeadsPage,
  LoginPage,
  MyTasksPage,
  NewActivityPage,
  NewCompanyPage,
  NewContactPage,
  NewLeadPage,
  NewOpportunityPage,
  NewPipelinePage,
  NewTaskPage,
  OpportunitiesPage,
  OpportunityDetailsPage,
  OverdueTasksPage,
  PipelinesPage,
  ProspectingListPage,
  ProspectingListsPage,
  NewProspectingListPage,
  OrganizationsPage,
  RegisterPage,
  ResetPasswordPage,
  CompletedTasksPage,
  TaskDetailsPage,
  TimelinePage,
  TodayTasksPage,
  UpcomingTasksPage,
  WorkspacePage,
  CadencesPage,
  NewCadencePage,
  CadenceDetailsPage,
  EditCadencePage,
  LeadScoringPage,
  ScoringRulesPage,
  NewScoringRulePage,
  EditScoringRulePage,
  PrioritiesPage,
  ReportsPage,
  LossAnalysisPage,
  CommercialAssistantPage,
  NotificationsPage,
  NotificationPreferencesPage,
  AuditPage,
  SettingsPage,
  OrganizationSettingsPage,
  MembersSettingsPage,
  TeamsSettingsPage,
  PermissionsSettingsPage,
  LeadSourcesSettingsPage,
  TagsSettingsPage,
  LossReasonsSettingsPage,
  PersonalSettingsPage,
} from './lazyPages'

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
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
      { path: '/timeline', element: <TimelinePage /> },
      { path: '/timeline/nova', element: <NewActivityPage /> },
      { path: '/timeline/:activityId', element: <ActivityDetailsPage /> },
      { path: '/tarefas', element: <MyTasksPage /> },
      { path: '/tarefas/hoje', element: <TodayTasksPage /> },
      { path: '/tarefas/atrasadas', element: <OverdueTasksPage /> },
      { path: '/tarefas/proximas', element: <UpcomingTasksPage /> },
      { path: '/tarefas/concluidas', element: <CompletedTasksPage /> },
      { path: '/tarefas/nova', element: <NewTaskPage /> },
      { path: '/tarefas/:taskId', element: <TaskDetailsPage /> },
      { path: '/tarefas/:taskId/editar', element: <EditTaskPage /> },
      { path: '/prospeccao', element: <ProspectingListsPage /> },
      { path: '/prospeccao/nova', element: <NewProspectingListPage /> },
      { path: '/prospeccao/:listId', element: <ProspectingListPage /> },
      { path: '/cadencias', element: <CadencesPage /> },
      { path: '/cadencias/nova', element: <NewCadencePage /> },
      { path: '/cadencias/:cadenceId', element: <CadenceDetailsPage /> },
      { path: '/cadencias/:cadenceId/editar', element: <EditCadencePage /> },
      { path: '/inteligencia/scoring', element: <LeadScoringPage /> },
      { path: '/inteligencia/scoring/regras', element: <ScoringRulesPage /> },
      { path: '/inteligencia/scoring/regras/nova', element: <NewScoringRulePage /> },
      {
        path: '/inteligencia/scoring/regras/:ruleId/editar',
        element: <EditScoringRulePage />,
      },
      { path: '/prioridades', element: <PrioritiesPage /> },
      { path: '/relatorios', element: <ReportsPage /> },
      { path: '/relatorios/perdas', element: <LossAnalysisPage /> },
      { path: '/inteligencia/assistente', element: <CommercialAssistantPage /> },
      { path: '/notificacoes', element: <NotificationsPage /> },
      { path: '/notificacoes/preferencias', element: <NotificationPreferencesPage /> },
      { path: '/auditoria', element: <AuditPage /> },
      { path: '/configuracoes', element: <SettingsPage /> },
      { path: '/configuracoes/organizacao', element: <OrganizationSettingsPage /> },
      { path: '/configuracoes/usuarios', element: <MembersSettingsPage /> },
      { path: '/configuracoes/equipes', element: <TeamsSettingsPage /> },
      { path: '/configuracoes/permissoes', element: <PermissionsSettingsPage /> },
      { path: '/configuracoes/origens', element: <LeadSourcesSettingsPage /> },
      { path: '/configuracoes/tags', element: <TagsSettingsPage /> },
      { path: '/configuracoes/motivos-de-perda', element: <LossReasonsSettingsPage /> },
      { path: '/configuracoes/pessoais', element: <PersonalSettingsPage /> },
    ],
  },
  {
    errorElement: <RouteErrorPage />,
    path: '/',
    element: (
      <ProtectedRoute>
        <WorkspacePage />
      </ProtectedRoute>
    ),
  },
  {
    errorElement: <RouteErrorPage />,
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    errorElement: <RouteErrorPage />,
    path: '/cadastro',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    errorElement: <RouteErrorPage />,
    path: '/recuperar-senha',
    element: (
      <GuestRoute>
        <ForgotPasswordPage />
      </GuestRoute>
    ),
  },
  {
    errorElement: <RouteErrorPage />,
    path: '/redefinir-senha',
    element: <ResetPasswordPage />,
  },
  {
    errorElement: <RouteErrorPage />,
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
