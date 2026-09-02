import { useParams } from 'react-router-dom'
import { EntityEditor } from '@/features/crm/components/EntityEditor'
export function EditCompanyPage() {
  const { companyId } = useParams()
  return <EntityEditor entity="companies" id={companyId} />
}
