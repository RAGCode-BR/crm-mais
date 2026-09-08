import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function MetricCard({
  emphasis,
  format,
  icon: Icon,
  label,
  value,
}: {
  emphasis?: 'success' | 'warning'
  format?: 'currency' | 'percent'
  icon: LucideIcon
  label: string
  value: number
}) {
  const formatted =
    format === 'currency'
      ? currency.format(value)
      : format === 'percent'
        ? `${number.format(value)}%`
        : number.format(value)

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground',
            emphasis === 'success' &&
              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            emphasis === 'warning' &&
              'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{formatted}</p>
    </article>
  )
}
