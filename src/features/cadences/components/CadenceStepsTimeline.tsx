import { CalendarClock } from 'lucide-react'

import type { CadenceStep } from '@/types/database/cadence'
import { cadenceStepTypeLabel } from '../cadence.constants'

export function CadenceStepsTimeline({ steps }: { steps: CadenceStep[] }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="font-semibold">Etapas da sequência</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A próxima tarefa nasce quando a anterior é concluída ou cancelada.
        </p>
      </div>
      <div className="divide-y divide-border">
        {steps.map((step) => (
          <div className="flex gap-4 p-4" key={step.id}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">
              {step.position}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{step.title}</h3>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">
                  {cadenceStepTypeLabel(step.type)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {step.description ?? 'Sem orientação adicional.'}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <CalendarClock className="size-4" /> Dia {step.day_number}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
