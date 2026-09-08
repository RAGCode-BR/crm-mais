import { BarChart3 } from 'lucide-react'
import type { DashboardPoint } from '../dashboard.types'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const number = new Intl.NumberFormat('pt-BR')

export function BarChart({
  data,
  description,
  format = 'number',
  title,
}: {
  data: DashboardPoint[]
  description: string
  format?: 'currency' | 'number'
  title: string
}) {
  const max = Math.max(...data.map((point) => point.value), 0)
  const populated = data.filter((point) => point.value > 0)

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      {populated.length ? (
        <div className="mt-6 space-y-4" role="img" aria-label={title}>
          {populated.map((point) => (
            <div key={point.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="truncate" title={point.label}>
                  {point.label}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {format === 'currency'
                    ? currency.format(point.value)
                    : number.format(point.value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(3, (point.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <BarChart3 className="mx-auto mb-2 size-5" aria-hidden="true" />
          Ainda não há dados para este gráfico.
        </div>
      )}
    </section>
  )
}
