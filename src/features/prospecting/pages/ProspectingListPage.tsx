import { ArrowLeft, Plus, Search, Target } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrganization } from '@/features/organizations/useOrganization'

import { AddProspectingItemsPanel } from '../components/AddProspectingItemsPanel'
import { ProspectingBulkActions } from '../components/ProspectingBulkActions'
import { ProspectingItemTable } from '../components/ProspectingItemTable'
import { prospectingItemStatuses, prospectingListStatuses } from '../prospecting.constants'
import {
  useProspectingList,
  useProspectingLookups,
  useUpdateProspectingList,
} from '../prospecting.hooks'

const pageSize = 25

export function ProspectingListPage() {
  const { listId } = useParams()
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId
  const canWrite = Boolean(activeOrganization && activeOrganization.role !== 'viewer')
  const [params, setParams] = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [addingItems, setAddingItems] = useState(false)
  const filters = {
    page: Math.max(1, Number(params.get('pagina') ?? '1') || 1),
    pageSize,
    search: params.get('busca') ?? '',
    status: params.get('status') ?? '',
    assigneeId: params.get('responsavel') ?? '',
  }
  const detail = useProspectingList(organizationId, listId, filters)
  const lookups = useProspectingLookups(organizationId)
  const updateList = useUpdateProspectingList(organizationId ?? '', listId ?? '')
  const setFilter = (key: string, value: string) => {
    setSelectedIds([])
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'pagina') next.delete('pagina')
        return next
      },
      { replace: true },
    )
  }

  if (!organizationId || !listId || detail.isLoading || lookups.isLoading)
    return <StatePanel kind="loading">Carregando lista de prospecção...</StatePanel>
  if (detail.error) return <StatePanel kind="error">{detail.error.message}</StatePanel>
  if (lookups.error) return <StatePanel kind="error">{lookups.error.message}</StatePanel>
  const { list, items } = detail.data!
  const members = lookups.data!.members
  const selectedOwner = members.find(({ value }) => value === list.owner_member_id)?.label
  const contacted = items.rows.filter(({ status }) => status === 'contacted').length
  const qualified = items.rows.filter(({ status }) => status === 'qualified').length

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        to="/prospeccao"
      >
        <ArrowLeft className="size-4" /> Voltar para listas
      </Link>
      <PageHeader
        actions={
          canWrite ? (
            <>
              <Button onClick={() => setAddingItems(true)}>
                <Plus className="size-4" /> Adicionar registros
              </Button>
            </>
          ) : null
        }
        description={list.description ?? 'Lista de trabalho para prospecção comercial.'}
        title={list.name}
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Registros</p>
          <p className="mt-2 text-2xl font-semibold">{items.count}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Contatados nesta página</p>
          <p className="mt-2 text-2xl font-semibold">{contacted}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Qualificados nesta página</p>
          <p className="mt-2 text-2xl font-semibold">{qualified}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Responsável padrão</p>
          <p className="mt-2 truncate font-semibold">{selectedOwner ?? 'Não atribuído'}</p>
        </div>
      </section>
      {canWrite ? (
        <div className="flex max-w-xs items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">Status da lista</span>
          <Select
            disabled={updateList.isPending}
            onChange={(event) =>
              void updateList.mutateAsync({
                status: event.target.value as Parameters<
                  typeof updateList.mutateAsync
                >[0]['status'],
              })
            }
            value={list.status}
          >
            {prospectingListStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      {addingItems ? (
        <AddProspectingItemsPanel
          defaultAssigneeId={list.owner_member_id ?? undefined}
          listId={listId}
          members={members}
          onClose={() => setAddingItems(false)}
          organizationId={organizationId}
        />
      ) : null}
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_13rem_15rem]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setFilter('busca', event.target.value)}
            placeholder="Buscar nesta lista..."
            value={filters.search}
          />
        </label>
        <Select
          onChange={(event) => setFilter('status', event.target.value)}
          value={filters.status}
        >
          <option value="">Todos os status</option>
          {prospectingItemStatuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          onChange={(event) => setFilter('responsavel', event.target.value)}
          value={filters.assigneeId}
        >
          <option value="">Todos os responsáveis</option>
          {members.map((member) => (
            <option key={member.value} value={member.value}>
              {member.label}
            </option>
          ))}
        </Select>
      </div>
      {canWrite && selectedIds.length ? (
        <ProspectingBulkActions
          actorMemberId={activeOrganization.membershipId}
          listId={listId}
          lookups={lookups.data!}
          onDone={() => setSelectedIds([])}
          organizationId={organizationId}
          selectedIds={selectedIds}
        />
      ) : null}
      {items.rows.length ? (
        <>
          <ProspectingItemTable
            items={items.rows}
            members={members}
            onSelectionChange={canWrite ? setSelectedIds : () => undefined}
            selectedIds={selectedIds}
            tags={lookups.data!.tags}
          />
          <Pagination
            count={items.count}
            onChange={(page) => setFilter('pagina', String(page))}
            page={filters.page}
            pageSize={pageSize}
          />
        </>
      ) : (
        <StatePanel>
          <Target className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum registro nesta visão</p>
          <p className="mt-1">
            {filters.search || filters.status || filters.assigneeId
              ? 'Revise os filtros aplicados.'
              : 'Adicione empresas ou leads para começar a prospectar.'}
          </p>
          {canWrite && !filters.search && !filters.status && !filters.assigneeId ? (
            <Button className="mt-4" onClick={() => setAddingItems(true)}>
              <Plus className="size-4" /> Adicionar registros
            </Button>
          ) : null}
        </StatePanel>
      )}
    </div>
  )
}
