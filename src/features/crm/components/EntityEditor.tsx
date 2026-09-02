import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { CompanyForm } from '@/features/companies/components/CompanyForm'
import { ContactForm } from '@/features/contacts/components/ContactForm'
import { LeadForm } from '@/features/leads/components/LeadForm'
import { useOrganization } from '@/features/organizations/useOrganization'
import type { Company, Contact, Lead } from '@/types/database/crm'
import {
  useCrmLookups,
  useCrmRecord,
  useSaveCompany,
  useSaveContact,
  useSaveLead,
} from '../crm.hooks'
import type { CompanyInput, ContactInput, EntityKind, LeadInput } from '../crm.types'
import { roleCanWrite } from '../crm.constants'

const emptyCompany: CompanyInput = {
  tradeName: '',
  legalName: '',
  taxId: '',
  industry: '',
  companySize: '',
  employeeCount: null,
  website: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  countryCode: 'BR',
  notes: '',
  ownerMemberId: '',
  leadSourceId: '',
  status: 'prospect',
}
const emptyContact: ContactInput = {
  companyId: '',
  firstName: '',
  lastName: '',
  jobTitle: '',
  department: '',
  phone: '',
  whatsapp: '',
  email: '',
  linkedinUrl: '',
  isPrimary: false,
  notes: '',
}
const emptyLead: LeadInput = {
  name: '',
  companyId: '',
  contactId: '',
  ownerMemberId: '',
  leadSourceId: '',
  email: '',
  phone: '',
  status: 'new',
  temperature: 'warm',
  score: 50,
  nextAction: '',
  nextContactAt: '',
  notes: '',
}

const fromCompany = (row: Company): CompanyInput => ({
  tradeName: row.trade_name,
  legalName: row.legal_name ?? '',
  taxId: row.tax_id ?? '',
  industry: row.industry ?? '',
  companySize: row.company_size ?? '',
  employeeCount: row.employee_count,
  website: row.website ?? '',
  phone: row.phone ?? '',
  email: row.email ?? '',
  city: row.city ?? '',
  state: row.state ?? '',
  countryCode: row.country_code,
  notes: row.notes ?? '',
  ownerMemberId: row.owner_member_id ?? '',
  leadSourceId: row.lead_source_id ?? '',
  status: row.status,
})
const fromContact = (row: Contact): ContactInput => ({
  companyId: row.company_id,
  firstName: row.first_name,
  lastName: row.last_name ?? '',
  jobTitle: row.job_title ?? '',
  department: row.department ?? '',
  phone: row.phone ?? '',
  whatsapp: row.whatsapp ?? '',
  email: row.email ?? '',
  linkedinUrl: row.linkedin_url ?? '',
  isPrimary: row.is_primary,
  notes: row.notes ?? '',
})
const fromLead = (row: Lead): LeadInput => ({
  name: row.name,
  companyId: row.company_id ?? '',
  contactId: row.contact_id ?? '',
  ownerMemberId: row.owner_member_id ?? '',
  leadSourceId: row.lead_source_id ?? '',
  email: row.email ?? '',
  phone: row.phone ?? '',
  status: row.status,
  temperature: row.temperature,
  score: row.score,
  nextAction: row.next_action ?? '',
  nextContactAt: row.next_contact_at
    ? new Date(row.next_contact_at).toISOString().slice(0, 16)
    : '',
  notes: row.notes ?? '',
})

const meta = {
  companies: { singular: 'empresa', title: 'Empresa', path: '/empresas' },
  contacts: { singular: 'contato', title: 'Contato', path: '/contatos' },
  leads: { singular: 'lead', title: 'Lead', path: '/leads' },
} as const

export function EntityEditor({ entity, id }: { entity: EntityKind; id?: string }) {
  const { activeOrganization } = useOrganization()
  const navigate = useNavigate()
  const organizationId = activeOrganization?.organizationId ?? ''
  const record = useCrmRecord(entity, organizationId, id)
  const lookups = useCrmLookups(organizationId)
  const companyMutation = useSaveCompany(organizationId, id)
  const contactMutation = useSaveContact(organizationId, id)
  const leadMutation = useSaveLead(organizationId, id)
  const current = meta[entity]
  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!roleCanWrite(activeOrganization.role))
    return <StatePanel kind="error">Seu perfil possui acesso somente para leitura.</StatePanel>
  if (id && record.isLoading)
    return <StatePanel kind="loading">Carregando {current.singular}...</StatePanel>
  if (record.error || lookups.error)
    return <StatePanel kind="error">{record.error?.message ?? lookups.error?.message}</StatePanel>
  const data = lookups.data ?? { companies: [], contacts: [], members: [], sources: [] }
  const onDone = (savedId: string) => navigate(`${current.path}/${savedId}`, { replace: true })
  return (
    <div className="space-y-6">
      <PageHeader
        description={
          id
            ? `Atualize os dados deste ${current.singular}.`
            : `Cadastre um novo ${current.singular} na organização ativa.`
        }
        title={`${id ? 'Editar' : 'Novo'} ${current.title.toLowerCase()}`}
      />
      {entity === 'companies' ? (
        <CompanyForm
          backTo={id ? `${current.path}/${id}` : current.path}
          defaultValues={id ? fromCompany(record.data as Company) : emptyCompany}
          id={id}
          isSaving={companyMutation.isPending}
          members={data.members}
          onSave={async (input) => onDone((await companyMutation.mutateAsync(input)).id)}
          organizationId={organizationId}
          sources={data.sources}
        />
      ) : entity === 'contacts' ? (
        <ContactForm
          backTo={id ? `${current.path}/${id}` : current.path}
          companies={data.companies}
          defaultValues={id ? fromContact(record.data as Contact) : emptyContact}
          id={id}
          isSaving={contactMutation.isPending}
          onSave={async (input) => onDone((await contactMutation.mutateAsync(input)).id)}
          organizationId={organizationId}
        />
      ) : (
        <LeadForm
          backTo={id ? `${current.path}/${id}` : current.path}
          companies={data.companies}
          contacts={data.contacts}
          defaultValues={id ? fromLead(record.data as Lead) : emptyLead}
          id={id}
          isSaving={leadMutation.isPending}
          members={data.members}
          onSave={async (input) => onDone((await leadMutation.mutateAsync(input)).id)}
          organizationId={organizationId}
          sources={data.sources}
        />
      )}
      {companyMutation.error || contactMutation.error || leadMutation.error ? (
        <StatePanel kind="error">
          {companyMutation.error?.message ??
            contactMutation.error?.message ??
            leadMutation.error?.message}
        </StatePanel>
      ) : null}
    </div>
  )
}
