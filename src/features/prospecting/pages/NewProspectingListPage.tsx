import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'

import { ProspectingListForm } from '../components/ProspectingListForm'
import { useCreateProspectingList, useProspectingLookups } from '../prospecting.hooks'

export function NewProspectingListPage() {
  const navigate = useNavigate()
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId
  const canWrite = Boolean(activeOrganization && activeOrganization.role !== 'viewer')
  const lookups = useProspectingLookups(organizationId)
  const createList = useCreateProspectingList(organizationId ?? '')

  return (
    <div className="space-y-6">
      <PageHeader
        description="Defina o objetivo da lista e um responsável padrão para a abordagem."
        title="Nova lista de prospecção"
      />
      {!organizationId || lookups.isLoading ? (
        <StatePanel kind="loading">Carregando responsáveis...</StatePanel>
      ) : !canWrite ? (
        <StatePanel kind="error">Seu papel possui acesso somente para leitura.</StatePanel>
      ) : lookups.error ? (
        <StatePanel kind="error">{lookups.error.message}</StatePanel>
      ) : (
        <>
          <ProspectingListForm
            isSaving={createList.isPending}
            members={lookups.data!.members}
            onSave={async (input) => {
              const list = await createList.mutateAsync(input)
              navigate(`/prospeccao/${list.id}`)
            }}
          />
          {createList.error ? (
            <StatePanel kind="error">{createList.error.message}</StatePanel>
          ) : null}
        </>
      )}
    </div>
  )
}
