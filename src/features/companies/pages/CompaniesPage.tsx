import { CrmListPage } from '@/features/crm/components/CrmListPage'
export function CompaniesPage() {
  return (
    <CrmListPage
      createLabel="Nova empresa"
      createPath="/empresas/nova"
      description="Organize contas, responsáveis e dados comerciais."
      entity="companies"
      title="Empresas"
    />
  )
}
