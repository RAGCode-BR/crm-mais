import { CheckCircle2, ListTodo, UsersRound, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cadenceStatusLabel } from '../cadence.constants'
import type { CadenceSummary } from '../cadence.types'

export function CadenceCard({ cadence }: { cadence: CadenceSummary }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-muted">
          <Workflow className="size-5" />
        </span>
        <span className="rounded-full bg-muted px-2 py-1 text-xs">
          {cadenceStatusLabel(cadence.status)}
        </span>
      </div>
      <h2 className="mt-4 font-semibold">{cadence.name}</h2>
      <p className="mt-1 min-h-10 text-sm text-muted-foreground">
        {cadence.description ?? 'Sem descrição'}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
        <span>
          <ListTodo className="mx-auto mb-1 size-4" />
          <strong className="block text-foreground">{cadence.stepCount}</strong> etapas
        </span>
        <span>
          <UsersRound className="mx-auto mb-1 size-4" />
          <strong className="block text-foreground">{cadence.activeEnrollmentCount}</strong> ativas
        </span>
        <span>
          <CheckCircle2 className="mx-auto mb-1 size-4" />
          <strong className="block text-foreground">{cadence.completedEnrollmentCount}</strong>{' '}
          concluídas
        </span>
      </div>
      <Link
        className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-md border border-border text-sm font-medium"
        to={`/cadencias/${cadence.id}`}
      >
        Abrir cadência
      </Link>
    </article>
  )
}
