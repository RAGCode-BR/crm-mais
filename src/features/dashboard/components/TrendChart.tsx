import { TrendingUp } from 'lucide-react'
import type { DashboardPoint } from '../dashboard.types'

function chartPoints(data: DashboardPoint[]) {
  const width = 600
  const height = 170
  const max = Math.max(...data.map((point) => point.value), 1)
  return data
    .map((point, index) => {
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width
      const y = height - (point.value / max) * (height - 12)
      return `${x},${y}`
    })
    .join(' ')
}

function shortDate(value: string) {
  const [, month, day] = value.split('-')
  return day && month ? `${day}/${month}` : value
}

export function TrendChart({
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
  const hasValues = data.some((point) => point.value > 0)
  const middle = data[Math.floor(data.length / 2)]
  const total = data.reduce((sum, point) => sum + point.value, 0)
  const formattedTotal =
    format === 'currency'
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(total)
      : new Intl.NumberFormat('pt-BR').format(total)

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      {data.length && hasValues ? (
        <div className="mt-6" role="img" aria-label={title}>
          <p className="mb-3 text-sm text-muted-foreground">
            Total no período: <strong className="text-foreground">{formattedTotal}</strong>
          </p>
          <svg className="h-44 w-full overflow-visible" viewBox="0 0 600 180">
            <path
              d="M0 42 H600 M0 85 H600 M0 128 H600"
              stroke="currentColor"
              className="text-border"
            />
            <polyline
              fill="none"
              points={chartPoints(data)}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              className="text-primary"
            />
          </svg>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{shortDate(data[0]?.label ?? '')}</span>
            <span>{shortDate(middle?.label ?? '')}</span>
            <span>{shortDate(data.at(-1)?.label ?? '')}</span>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <TrendingUp className="mx-auto mb-2 size-5" aria-hidden="true" />
          Ainda não há movimentação no período.
        </div>
      )}
    </section>
  )
}
