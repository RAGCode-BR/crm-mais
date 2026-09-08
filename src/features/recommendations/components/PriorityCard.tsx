import { BriefcaseBusiness, ListTodo, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils/cn'

import { recommendationPriorityLabel } from '../recommendation.constants'
import type { CommercialRecommendation } from '../recommendation.types'

const icons = { lead: Target, task: ListTodo, opportunity: BriefcaseBusiness }

export function PriorityCard({ recommendation }: { recommendation: CommercialRecommendation }) {
  const Icon = icons[recommendation.category]
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{recommendation.title}</h2>
            <span
              className={cn(
                'rounded-full px-2 py-1 text-xs font-medium',
                recommendation.priority === 'urgent' && 'bg-red-100 text-red-800',
                recommendation.priority === 'high' && 'bg-orange-100 text-orange-800',
                recommendation.priority === 'medium' && 'bg-amber-100 text-amber-800',
                recommendation.priority === 'low' && 'bg-slate-100 text-slate-700',
              )}
            >
              {recommendationPriorityLabel(recommendation.priority)}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{recommendation.reason}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Responsável: {recommendation.ownerName}
              {recommendation.score !== null ? ` · Score ${recommendation.score}` : ''}
            </p>
            <Link
              className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              to={recommendation.actionPath}
            >
              {recommendation.actionLabel}
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
