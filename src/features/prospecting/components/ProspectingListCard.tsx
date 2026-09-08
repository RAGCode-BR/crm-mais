import { ArrowRight, Target, UserRoundCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Option } from '@/features/crm/crm.types'

import { prospectingListStatusLabel } from '../prospecting.constants'
import type { ProspectingListSummary } from '../prospecting.types'

export function ProspectingListCard({
  list,
  members,
}: {
  list: ProspectingListSummary
  members: Option[]
}) {
  const owner = members.find(({ value }) => value === list.owner_member_id)?.label
  return (
    <Link
      className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
      to={`/prospeccao/${list.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-semibold">{list.name}</h2>
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              {prospectingListStatusLabel(list.status)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {list.description ?? 'Sem descrição.'}
          </p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
        <div>
          <span className="block text-xs text-muted-foreground">Na lista</span>
          <strong>{list.itemCount} registros</strong>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Contatados</span>
          <strong>{list.contactedCount} contatados</strong>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Qualificados</span>
          <strong>{list.qualifiedCount} qualificados</strong>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        {owner ? <UserRoundCheck className="size-3.5" /> : <Target className="size-3.5" />}
        {owner ?? 'Responsabilidade distribuída nos itens'}
      </div>
    </Link>
  )
}
