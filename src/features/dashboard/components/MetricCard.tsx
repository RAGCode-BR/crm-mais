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
  tone = 'blue',
  value,
}: {
  emphasis?: 'success' | 'warning'
  format?: 'currency' | 'percent'
  icon: LucideIcon
  label: string
  tone?: 'blue' | 'cyan' | 'violet' | 'green' | 'amber' | 'rose'
  value: number
}) {
  const formatted =
    format === 'currency'
      ? currency.format(value)
      : format === 'percent'
        ? `${number.format(value)}%`
        : number.format(value)

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm shadow-slate-950/[0.025] transition-transform hover:-translate-y-0.5">
      <span
        className={cn(
          'absolute inset-x-0 top-0 h-1',
          tone === 'blue' && 'bg-blue-500',
          tone === 'cyan' && 'bg-cyan-500',
          tone === 'violet' && 'bg-violet-500',
          tone === 'green' && 'bg-emerald-500',
          tone === 'amber' && 'bg-amber-500',
          tone === 'rose' && 'bg-rose-500',
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl',
            tone === 'blue' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
            tone === 'cyan' && 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
            tone === 'violet' &&
              'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
            tone === 'green' &&
              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            tone === 'amber' &&
              'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
            tone === 'rose' && 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
            emphasis === 'success' &&
              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            emphasis === 'warning' &&
              'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight">{formatted}</p>
    </article>
  )
}
