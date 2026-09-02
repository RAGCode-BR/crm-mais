import { Navigate, useParams } from 'react-router-dom'
import { EntityDetails } from '@/features/crm/components/EntityDetails'
export function LeadDetailsPage() {
  const { leadId } = useParams()
  return leadId ? <EntityDetails entity="leads" id={leadId} /> : <Navigate replace to="/leads" />
}
