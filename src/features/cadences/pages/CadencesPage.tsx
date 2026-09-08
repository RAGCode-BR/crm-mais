import { Plus, Search, Workflow } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrganization } from '@/features/organizations/useOrganization'

import { CadenceCard } from '../components/CadenceCard'
import { cadenceCanManage, cadenceStatuses } from '../cadence.constants'
import { useCadences } from '../cadence.hooks'

export function CadencesPage() {
  const { activeOrganization } = useOrganization()
  const [params, setParams] = useSearchParams()
  const filters = { search: params.get('busca') ?? '', status: params.get('status') ?? '' }
  const query = useCadences(activeOrganization?.organizationId, filters)
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
          cadenceCanManage(activeOrganization?.role) ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              to="/cadencias/nova"
            >
              <Plus className="size-4" /> Nova cadência
            </Link>
          ) : undefined
        }
        description="Organize abordagens comerciais em sequências de tarefas internas."
        title="Cadências"
      />
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_14rem]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setFilter('busca', event.target.value)}
            placeholder="Buscar cadência..."
            value={filters.search}
          />
        </label>
        <Select
          onChange={(event) => setFilter('status', event.target.value)}
          value={filters.status}
        >
          <option value="">Todos os status</option>
          {cadenceStatuses
            .filter(({ value }) => value !== 'archived')
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </Select>
      </div>
      {query.isLoading ? (
        <StatePanel kind="loading">Carregando cadências...</StatePanel>
      ) : query.error ? (
        <StatePanel kind="error">{query.error.message}</StatePanel>
      ) : query.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((cadence) => (
            <CadenceCard cadence={cadence} key={cadence.id} />
          ))}
        </div>
      ) : (
        <StatePanel>
          <Workflow className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhuma cadência encontrada</p>
          <p className="mt-1">
            Crie uma sequência para transformar o acompanhamento em tarefas organizadas.
          </p>
        </StatePanel>
      )}
    </div>
  )
}
