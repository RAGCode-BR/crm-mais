import { Navigate, useParams } from 'react-router-dom'
import { EntityDetails } from '@/features/crm/components/EntityDetails'
export function CompanyDetailsPage() {
  const { companyId } = useParams()
  return companyId ? (
    <EntityDetails entity="companies" id={companyId} />
  ) : (
    <Navigate replace to="/empresas" />
  )
}
