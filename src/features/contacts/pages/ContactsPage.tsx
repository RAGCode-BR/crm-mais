import { CrmListPage } from '@/features/crm/components/CrmListPage'
export function ContactsPage() {
  return (
    <CrmListPage
      createLabel="Novo contato"
      createPath="/contatos/novo"
      description="Pessoas vinculadas às empresas da organização."
      entity="contacts"
      title="Contatos"
    />
  )
}
