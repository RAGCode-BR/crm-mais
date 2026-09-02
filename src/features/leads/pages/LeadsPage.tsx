import { CrmListPage } from '@/features/crm/components/CrmListPage'
export function LeadsPage() {
  return (
    <CrmListPage
      createLabel="Novo lead"
      createPath="/leads/novo"
      description="Acompanhe potenciais clientes e próximos passos."
      entity="leads"
      title="Leads"
    />
  )
}
