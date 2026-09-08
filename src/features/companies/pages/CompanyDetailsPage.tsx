import { Navigate, useParams } from 'react-router-dom'
import { CompanySummaryPanel } from '@/features/ai/components/CompanySummaryPanel'
import { EntityDetails } from '@/features/crm/components/EntityDetails'
export function CompanyDetailsPage() {
  const { companyId } = useParams()
  return companyId ? (
    <div className="space-y-6">
      <EntityDetails entity="companies" id={companyId} />
      <CompanySummaryPanel companyId={companyId} />
    </div>
  ) : (
    <Navigate replace to="/empresas" />
  )
}
