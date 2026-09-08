import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StatePanel } from '@/components/shared/StatePanel'

import type { ScoredLead } from '../scoring.types'
import { ScoreBadge } from './ScoreBadge'

function firstReason(lead: ScoredLead) {
  if (!Array.isArray(lead.breakdown)) return 'Score calculado pelas regras ativas.'
  const first = lead.breakdown[0]
  if (!first || Array.isArray(first) || typeof first !== 'object')
    return 'Score calculado pelas regras ativas.'
  const reason = first.reason
  return typeof reason === 'string' ? reason : 'Score calculado pelas regras ativas.'
}

export function ScoredLeadList({
  description,
  empty,
  icon: Icon,
  leads,
  title,
}: {
  description: string
  empty: string
  icon: LucideIcon
  leads: ScoredLead[]
  title: string
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {leads.length ? (
        <div className="divide-y divide-border">
          {leads.slice(0, 10).map((lead) => (
            <Link
              className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40"
              key={lead.id}
              to={`/leads/${lead.id}`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{lead.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {lead.companyName} · {lead.ownerName}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{firstReason(lead)}</p>
              </div>
              <ScoreBadge classification={lead.classification} score={lead.score} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <StatePanel>{empty}</StatePanel>
        </div>
      )}
    </section>
  )
}
