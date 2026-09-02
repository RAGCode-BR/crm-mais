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
