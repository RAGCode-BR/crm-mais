import { Navigate, useParams } from 'react-router-dom'
import { EntityDetails } from '@/features/crm/components/EntityDetails'
export function ContactDetailsPage() {
  const { contactId } = useParams()
  return contactId ? (
    <EntityDetails entity="contacts" id={contactId} />
  ) : (
    <Navigate replace to="/contatos" />
  )
}
