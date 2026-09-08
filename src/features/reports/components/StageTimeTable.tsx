import { Clock3 } from 'lucide-react'

import type { StageTime } from '../report.types'

export function StageTimeTable({ rows }: { rows: StageTime[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Tempo médio por etapa</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tempo atual das oportunidades abertas em cada etapa.
      </p>
      {rows.length ? (
        <div className="mt-5 divide-y divide-border">
          {rows.map((row) => (
            <div className="flex items-center justify-between gap-4 py-3" key={row.label}>
              <div>
                <p className="font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">
                  {row.opportunityCount} oportunidade{row.opportunityCount === 1 ? '' : 's'}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm">
                <Clock3 className="size-4 text-muted-foreground" />
                {row.averageDays.toLocaleString('pt-BR')} dias
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Nenhuma oportunidade aberta para analisar.
        </p>
      )}
    </section>
  )
}
