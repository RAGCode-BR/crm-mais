import { useParams } from 'react-router-dom'
import { EntityEditor } from '@/features/crm/components/EntityEditor'
export function EditLeadPage() {
  const { leadId } = useParams()
  return <EntityEditor entity="leads" id={leadId} />
}
