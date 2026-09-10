import { lazy } from 'react'

export const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)

export const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
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

export const CompaniesPage = lazy(() =>
  import('@/features/companies/pages/CompaniesPage').then((module) => ({
    default: module.CompaniesPage,
  })),
)
export const NewCompanyPage = lazy(() =>
  import('@/features/companies/pages/NewCompanyPage').then((module) => ({
    default: module.NewCompanyPage,
  })),
)
export const CompanyDetailsPage = lazy(() =>
  import('@/features/companies/pages/CompanyDetailsPage').then((module) => ({
    default: module.CompanyDetailsPage,
  })),
)
export const EditCompanyPage = lazy(() =>
  import('@/features/companies/pages/EditCompanyPage').then((module) => ({
    default: module.EditCompanyPage,
  })),
)
export const ContactsPage = lazy(() =>
  import('@/features/contacts/pages/ContactsPage').then((module) => ({
    default: module.ContactsPage,
  })),
)
export const NewContactPage = lazy(() =>
  import('@/features/contacts/pages/NewContactPage').then((module) => ({
    default: module.NewContactPage,
  })),
)
export const ContactDetailsPage = lazy(() =>
  import('@/features/contacts/pages/ContactDetailsPage').then((module) => ({
    default: module.ContactDetailsPage,
  })),
)
export const EditContactPage = lazy(() =>
  import('@/features/contacts/pages/EditContactPage').then((module) => ({
    default: module.EditContactPage,
  })),
)
export const LeadsPage = lazy(() =>
  import('@/features/leads/pages/LeadsPage').then((module) => ({ default: module.LeadsPage })),
)
export const NewLeadPage = lazy(() =>
  import('@/features/leads/pages/NewLeadPage').then((module) => ({ default: module.NewLeadPage })),
)
export const LeadDetailsPage = lazy(() =>
  import('@/features/leads/pages/LeadDetailsPage').then((module) => ({
    default: module.LeadDetailsPage,
  })),
)
export const EditLeadPage = lazy(() =>
  import('@/features/leads/pages/EditLeadPage').then((module) => ({
    default: module.EditLeadPage,
  })),
)

export const OpportunitiesPage = lazy(() =>
  import('@/features/pipeline/pages/OpportunitiesPage').then((module) => ({
    default: module.OpportunitiesPage,
  })),
)

export const NewOpportunityPage = lazy(() =>
  import('@/features/pipeline/pages/NewOpportunityPage').then((module) => ({
    default: module.NewOpportunityPage,
  })),
)

export const OpportunityDetailsPage = lazy(() =>
  import('@/features/pipeline/pages/OpportunityDetailsPage').then((module) => ({
    default: module.OpportunityDetailsPage,
  })),
)

export const EditOpportunityPage = lazy(() =>
  import('@/features/pipeline/pages/EditOpportunityPage').then((module) => ({
    default: module.EditOpportunityPage,
  })),
)

export const PipelinesPage = lazy(() =>
  import('@/features/pipeline/pages/PipelinesPage').then((module) => ({
    default: module.PipelinesPage,
  })),
)

export const NewPipelinePage = lazy(() =>
  import('@/features/pipeline/pages/NewPipelinePage').then((module) => ({
    default: module.NewPipelinePage,
  })),
)

export const EditPipelinePage = lazy(() =>
  import('@/features/pipeline/pages/EditPipelinePage').then((module) => ({
    default: module.EditPipelinePage,
  })),
)

export const TimelinePage = lazy(() =>
  import('@/features/timeline/pages/TimelinePage').then((module) => ({
    default: module.TimelinePage,
  })),
)

export const NewActivityPage = lazy(() =>
  import('@/features/timeline/pages/NewActivityPage').then((module) => ({
    default: module.NewActivityPage,
  })),
)

export const ActivityDetailsPage = lazy(() =>
  import('@/features/timeline/pages/ActivityDetailsPage').then((module) => ({
    default: module.ActivityDetailsPage,
  })),
)

export const MyTasksPage = lazy(() =>
  import('@/features/tasks/pages/MyTasksPage').then((module) => ({
    default: module.MyTasksPage,
  })),
)

export const TodayTasksPage = lazy(() =>
  import('@/features/tasks/pages/TodayTasksPage').then((module) => ({
    default: module.TodayTasksPage,
  })),
)

export const OverdueTasksPage = lazy(() =>
  import('@/features/tasks/pages/OverdueTasksPage').then((module) => ({
    default: module.OverdueTasksPage,
  })),
)

export const UpcomingTasksPage = lazy(() =>
  import('@/features/tasks/pages/UpcomingTasksPage').then((module) => ({
    default: module.UpcomingTasksPage,
  })),
)

export const CompletedTasksPage = lazy(() =>
  import('@/features/tasks/pages/CompletedTasksPage').then((module) => ({
    default: module.CompletedTasksPage,
  })),
)

export const NewTaskPage = lazy(() =>
  import('@/features/tasks/pages/NewTaskPage').then((module) => ({
    default: module.NewTaskPage,
  })),
)

export const TaskDetailsPage = lazy(() =>
  import('@/features/tasks/pages/TaskDetailsPage').then((module) => ({
    default: module.TaskDetailsPage,
  })),
)

export const EditTaskPage = lazy(() =>
  import('@/features/tasks/pages/EditTaskPage').then((module) => ({
    default: module.EditTaskPage,
  })),
)

export const ProspectingListsPage = lazy(() =>
  import('@/features/prospecting/pages/ProspectingListsPage').then((module) => ({
    default: module.ProspectingListsPage,
  })),
)

export const NewProspectingListPage = lazy(() =>
  import('@/features/prospecting/pages/NewProspectingListPage').then((module) => ({
    default: module.NewProspectingListPage,
  })),
)

export const ProspectingListPage = lazy(() =>
  import('@/features/prospecting/pages/ProspectingListPage').then((module) => ({
    default: module.ProspectingListPage,
  })),
)

export const CadencesPage = lazy(() =>
  import('@/features/cadences/pages/CadencesPage').then((module) => ({
    default: module.CadencesPage,
  })),
)

export const NewCadencePage = lazy(() =>
  import('@/features/cadences/pages/NewCadencePage').then((module) => ({
    default: module.NewCadencePage,
  })),
)

export const CadenceDetailsPage = lazy(() =>
  import('@/features/cadences/pages/CadenceDetailsPage').then((module) => ({
    default: module.CadenceDetailsPage,
  })),
)

export const EditCadencePage = lazy(() =>
  import('@/features/cadences/pages/EditCadencePage').then((module) => ({
    default: module.EditCadencePage,
  })),
)

export const LeadScoringPage = lazy(() =>
  import('@/features/scoring/pages/LeadScoringPage').then((module) => ({
    default: module.LeadScoringPage,
  })),
)

export const ScoringRulesPage = lazy(() =>
  import('@/features/scoring/pages/ScoringRulesPage').then((module) => ({
    default: module.ScoringRulesPage,
  })),
)

export const NewScoringRulePage = lazy(() =>
  import('@/features/scoring/pages/NewScoringRulePage').then((module) => ({
    default: module.NewScoringRulePage,
  })),
)

export const EditScoringRulePage = lazy(() =>
  import('@/features/scoring/pages/EditScoringRulePage').then((module) => ({
    default: module.EditScoringRulePage,
  })),
)

export const PrioritiesPage = lazy(() =>
  import('@/features/recommendations/pages/PrioritiesPage').then((module) => ({
    default: module.PrioritiesPage,
  })),
)

export const ReportsPage = lazy(() =>
  import('@/features/reports/pages/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  })),
)

export const LossAnalysisPage = lazy(() =>
  import('@/features/reports/pages/LossAnalysisPage').then((module) => ({
    default: module.LossAnalysisPage,
  })),
)

export const CommercialAssistantPage = lazy(() =>
  import('@/features/ai/pages/CommercialAssistantPage').then((module) => ({
    default: module.CommercialAssistantPage,
  })),
)

export const NotificationsPage = lazy(() =>
  import('@/features/notifications/pages/NotificationsPage').then((module) => ({
    default: module.NotificationsPage,
  })),
)

export const NotificationPreferencesPage = lazy(() =>
  import('@/features/notifications/pages/NotificationPreferencesPage').then((module) => ({
    default: module.NotificationPreferencesPage,
  })),
)

export const AuditPage = lazy(() =>
  import('@/features/audit/pages/AuditPage').then((module) => ({
    default: module.AuditPage,
  })),
)

export const SettingsPage = lazy(() =>
  import('@/features/settings/pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)
export const OrganizationSettingsPage = lazy(() =>
  import('@/features/settings/pages/OrganizationSettingsPage').then((module) => ({
    default: module.OrganizationSettingsPage,
  })),
)
export const MembersSettingsPage = lazy(() =>
  import('@/features/settings/pages/MembersSettingsPage').then((module) => ({
    default: module.MembersSettingsPage,
  })),
)
export const TeamsSettingsPage = lazy(() =>
  import('@/features/settings/pages/TeamsSettingsPage').then((module) => ({
    default: module.TeamsSettingsPage,
  })),
)
export const PermissionsSettingsPage = lazy(() =>
  import('@/features/settings/pages/PermissionsSettingsPage').then((module) => ({
    default: module.PermissionsSettingsPage,
  })),
)
export const LeadSourcesSettingsPage = lazy(() =>
  import('@/features/settings/pages/LeadSourcesSettingsPage').then((module) => ({
    default: module.LeadSourcesSettingsPage,
  })),
)
export const TagsSettingsPage = lazy(() =>
  import('@/features/settings/pages/TagsSettingsPage').then((module) => ({
    default: module.TagsSettingsPage,
  })),
)
export const LossReasonsSettingsPage = lazy(() =>
  import('@/features/settings/pages/LossReasonsSettingsPage').then((module) => ({
    default: module.LossReasonsSettingsPage,
  })),
)
export const PersonalSettingsPage = lazy(() =>
  import('@/features/settings/pages/PersonalSettingsPage').then((module) => ({
    default: module.PersonalSettingsPage,
  })),
)
