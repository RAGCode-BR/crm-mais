import { useParams } from 'react-router-dom'
import { EntityEditor } from '@/features/crm/components/EntityEditor'
export function EditContactPage() {
  const { contactId } = useParams()
  return <EntityEditor entity="contacts" id={contactId} />
}
