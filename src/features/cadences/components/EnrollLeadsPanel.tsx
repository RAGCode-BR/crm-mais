import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

import { useEnrollLeads } from '../cadence.hooks'
import type { CadenceLookups } from '../cadence.types'

export function EnrollLeadsPanel({
  cadenceId,
  lookups,
  onClose,
  organizationId,
}: {
  cadenceId: string
  lookups: CadenceLookups
  onClose: () => void
  organizationId: string
}) {
  const [leadIds, setLeadIds] = useState<string[]>([])
  const [assignedMemberId, setAssignedMemberId] = useState('')
  const mutation = useEnrollLeads(organizationId, cadenceId)
  return (
    <section className="rounded-xl border border-primary/30 bg-card p-5">
      <h2 className="font-semibold">Adicionar leads à cadência</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Selecione os leads e o responsável pelas tarefas internas.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Leads
          <select
            className="mt-2 min-h-40 w-full rounded-md border border-border bg-background p-2 text-sm"
            multiple
            onChange={(event) =>
              setLeadIds(Array.from(event.target.selectedOptions, ({ value }) => value))
            }
            value={leadIds}
          >
            {lookups.leads.map((lead) => (
              <option key={lead.value} value={lead.value}>
                {lead.label} — {lead.description}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Responsável
          <Select
            className="mt-2"
            onChange={(event) => setAssignedMemberId(event.target.value)}
            value={assignedMemberId}
          >
            <option value="">Selecione...</option>
            {lookups.members.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose} variant="ghost">
          Cancelar
        </Button>
        <Button
          disabled={!leadIds.length || !assignedMemberId || mutation.isPending}
          onClick={async () => {
            await mutation.mutateAsync({ leadIds, assignedMemberId })
            onClose()
          }}
        >
          {mutation.isPending ? 'Adicionando...' : 'Iniciar cadência'}
        </Button>
      </div>
      {mutation.error ? (
        <p className="mt-3 text-sm text-red-600">{mutation.error.message}</p>
      ) : null}
    </section>
  )
}
