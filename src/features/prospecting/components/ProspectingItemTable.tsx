import { Building2, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Option } from '@/features/crm/crm.types'
import type { ProspectingItemRow } from '../prospecting.types'
import { prospectingItemStatusLabel } from '../prospecting.constants'

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function ProspectingItemTable({
  items,
  members,
  onSelectionChange,
  selectedIds,
  tags,
}: {
  items: ProspectingItemRow[]
  members: Option[]
  onSelectionChange: (ids: string[]) => void
  selectedIds: string[]
  tags: Array<Option & { color: string | null }>
}) {
  const selected = new Set(selectedIds)
  const allSelected = items.length > 0 && items.every(({ id }) => selected.has(id))
  const toggle = (id: string) =>
    onSelectionChange(
      selected.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    )
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                aria-label="Selecionar todos"
                checked={allSelected}
                className="size-4 accent-[var(--primary)]"
                onChange={() => onSelectionChange(allSelected ? [] : items.map(({ id }) => id))}
                type="checkbox"
              />
            </th>
            <th className="px-3 py-3 font-medium">Registro</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Responsável</th>
            <th className="px-3 py-3 font-medium">Tags</th>
            <th className="px-4 py-3 font-medium">Última ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const Icon = item.entityKind === 'company' ? Building2 : Target
            const owner = members.find(({ value }) => value === item.assigned_member_id)?.label
            return (
              <tr className="hover:bg-muted/25" key={item.id}>
                <td className="px-4 py-4">
                  <input
                    aria-label={`Selecionar ${item.entityLabel}`}
                    checked={selected.has(item.id)}
                    className="size-4 accent-[var(--primary)]"
                    onChange={() => toggle(item.id)}
                    type="checkbox"
                  />
                </td>
                <td className="px-3 py-4">
                  <Link
                    className="flex items-start gap-3 hover:text-primary"
                    to={`/${item.entityKind === 'company' ? 'empresas' : 'leads'}/${item.company_id ?? item.lead_id}`}
                  >
                    <span className="mt-0.5 rounded-md bg-muted p-2">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{item.entityLabel}</span>
                      <span className="block max-w-sm truncate text-xs text-muted-foreground">
                        {item.entityDescription}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-4">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    {prospectingItemStatusLabel(item.status)}
                  </span>
                </td>
                <td className="px-3 py-4 text-muted-foreground">{owner ?? 'Não atribuído'}</td>
                <td className="px-3 py-4">
                  <div className="flex max-w-52 flex-wrap gap-1">
                    {item.tagIds.length ? (
                      item.tagIds.map((tagId) => {
                        const tag = tags.find(({ value }) => value === tagId)
                        return tag ? (
                          <span
                            className="rounded-full border border-border px-2 py-0.5 text-xs"
                            key={tagId}
                            style={tag.color ? { borderColor: tag.color } : undefined}
                          >
                            {tag.label}
                          </span>
                        ) : null
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem tags</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {item.last_action_at ? dateTime.format(new Date(item.last_action_at)) : 'Nenhuma'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
