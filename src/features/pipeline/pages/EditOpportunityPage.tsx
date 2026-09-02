import { Navigate, useParams } from 'react-router-dom'
import { OpportunityEditor } from '../components/OpportunityEditor'
export function EditOpportunityPage() {
  const { opportunityId } = useParams()
  return opportunityId ? (
    <OpportunityEditor id={opportunityId} />
  ) : (
    <Navigate replace to="/oportunidades" />
  )
}
