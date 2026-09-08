import { Plus, Search, Target } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrganization } from '@/features/organizations/useOrganization'

import { ProspectingListCard } from '../components/ProspectingListCard'
import { prospectingListStatuses } from '../prospecting.constants'
import { useProspectingLists, useProspectingLookups } from '../prospecting.hooks'

export function ProspectingListsPage() {
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId
  const canWrite = Boolean(activeOrganization && activeOrganization.role !== 'viewer')
  const [params, setParams] = useSearchParams()
  const filters = {
    search: params.get('busca') ?? '',
    status: params.get('status') ?? '',
    ownerId: params.get('responsavel') ?? '',
  }
  const lists = useProspectingLists(organizationId, filters)
  const lookups = useProspectingLookups(organizationId)
  const setFilter = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          canWrite ? (
            <Link to="/prospeccao/nova">
              <Button>
                <Plus className="size-4" /> Nova lista
              </Button>
            </Link>
          ) : null
        }
        description="Organize empresas e leads em listas focadas na produtividade comercial."
        title="Prospecção"
      />
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_13rem_15rem]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setFilter('busca', event.target.value)}
            placeholder="Buscar listas..."
            value={filters.search}
          />
        </label>
        <Select
          onChange={(event) => setFilter('status', event.target.value)}
          value={filters.status}
        >
          <option value="">Todos os status</option>
          {prospectingListStatuses
            .filter(({ value }) => value !== 'archived')
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </Select>
        <Select
          disabled={lookups.isLoading}
          onChange={(event) => setFilter('responsavel', event.target.value)}
          value={filters.ownerId}
        >
          <option value="">Todos os responsáveis</option>
          {(lookups.data?.members ?? []).map((member) => (
            <option key={member.value} value={member.value}>
              {member.label}
            </option>
          ))}
        </Select>
      </div>
      {lists.isLoading || lookups.isLoading ? (
        <StatePanel kind="loading">Carregando listas de prospecção...</StatePanel>
      ) : lists.error ? (
        <StatePanel kind="error">{lists.error.message}</StatePanel>
      ) : lookups.error ? (
        <StatePanel kind="error">{lookups.error.message}</StatePanel>
      ) : lists.data?.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lists.data.map((list) => (
            <ProspectingListCard key={list.id} list={list} members={lookups.data!.members} />
          ))}
        </section>
      ) : (
        <StatePanel>
          <Target className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhuma lista encontrada</p>
          <p className="mt-1">Crie uma lista para organizar a próxima frente de prospecção.</p>
          {canWrite ? (
            <Link className="mt-4 inline-flex" to="/prospeccao/nova">
              <Button>
                <Plus className="size-4" /> Criar primeira lista
              </Button>
            </Link>
          ) : null}
        </StatePanel>
      )}
    </div>
  )
}
