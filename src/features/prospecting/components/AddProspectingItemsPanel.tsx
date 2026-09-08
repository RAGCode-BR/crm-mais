import { Building2, Plus, Search, Target, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { StateXs } from './StateXs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Option } from '@/features/crm/crm.types'

import { useAddProspectingItems, useProspectingCandidates } from '../prospecting.hooks'
import type { ProspectingCandidate } from '../prospecting.types'

export function AddProspectingItemsPanel({
  listId,
  members,
  defaultAssigneeId,
  onClose,
  organizationId,
}: {
  listId: string
  members: Option[]
  defaultAssigneeId?: string
  onClose: () => void
  organizationId: string
}) {
  const [search, setSearch] = useState('')
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? '')
  const [selected, setSelected] = useState<Record<string, ProspectingCandidate>>({})
  const candidates = useProspectingCandidates(organizationId, listId, search, true)
  const addItems = useAddProspectingItems(organizationId, listId)
  const selectedItems = useMemo(() => Object.values(selected), [selected])

  const toggle = (candidate: ProspectingCandidate) =>
    setSelected((current) => {
      const next = { ...current }
      if (next[candidate.id]) delete next[candidate.id]
      else next[candidate.id] = candidate
      return next
    })

  const add = async () => {
    await addItems.mutateAsync({ candidates: selectedItems, assignedMemberId: assigneeId })
    onClose()
  }

  return (
    <section className="rounded-xl border border-primary/30 bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Adicionar empresas e leads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione registros existentes no CRM para compor esta lista.
          </p>
        </div>
        <Button aria-label="Fechar" className="size-9 px-0" onClick={onClose} variant="ghost">
          <X className="size-4" />
        </Button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_16rem]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar empresa, lead ou e-mail..."
            value={search}
          />
        </label>
        <Select onChange={(event) => setAssigneeId(event.target.value)} value={assigneeId}>
          <option value="">Sem responsável</option>
          {members.map((member) => (
            <option key={member.value} value={member.value}>
              {member.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
        {candidates.isLoading ? (
          <StateXs>Buscando registros...</StateXs>
        ) : candidates.error ? (
          <StateXs tone="error">{candidates.error.message}</StateXs>
        ) : candidates.data?.length ? (
          candidates.data.map((candidate) => {
            const Icon = candidate.kind === 'company' ? Building2 : Target
            return (
              <label
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
                key={`${candidate.kind}-${candidate.id}`}
              >
                <input
                  checked={Boolean(selected[candidate.id])}
                  className="size-4 accent-[var(--primary)]"
                  onChange={() => toggle(candidate)}
                  type="checkbox"
                />
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{candidate.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {candidate.description}
                  </span>
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {candidate.kind === 'company' ? 'Empresa' : 'Lead'}
                </span>
              </label>
            )
          })
        ) : (
          <StateXs>Nenhum registro disponível para adicionar.</StateXs>
        )}
      </div>
      {addItems.error ? (
        <p className="mt-3 text-sm text-red-600">{addItems.error.message}</p>
      ) : null}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">
          {selectedItems.length} selecionado{selectedItems.length === 1 ? '' : 's'}
        </span>
        <Button disabled={!selectedItems.length || addItems.isPending} onClick={() => void add()}>
          <Plus className="size-4" />
          {addItems.isPending ? 'Adicionando...' : 'Adicionar à lista'}
        </Button>
      </div>
    </section>
  )
}
