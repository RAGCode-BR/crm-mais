import { FilterX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { DashboardFilters, DashboardLookups } from '../dashboard.types'

export function DashboardFilterBar({
  error,
  filters,
  lookups,
  onChange,
  onReset,
}: {
  error?: string
  filters: DashboardFilters
  lookups: DashboardLookups
  onChange: (key: keyof DashboardFilters, value: string) => void
  onReset: () => void
}) {
  const selects: Array<{
    key: keyof DashboardFilters
    label: string
    options: DashboardLookups[keyof DashboardLookups]
  }> = [
    { key: 'ownerId', label: 'Todos os responsáveis', options: lookups.members },
    { key: 'teamId', label: 'Todas as equipes', options: lookups.teams },
    { key: 'sourceId', label: 'Todas as origens', options: lookups.sources },
    { key: 'industry', label: 'Todos os segmentos', options: lookups.industries },
    { key: 'product', label: 'Todos os produtos', options: lookups.products },
    { key: 'pipelineId', label: 'Todos os pipelines', options: lookups.pipelines },
  ]

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          aria-label="Data inicial"
          onChange={(event) => onChange('from', event.target.value)}
          type="date"
          value={filters.from}
        />
        <Input
          aria-label="Data final"
          onChange={(event) => onChange('to', event.target.value)}
          type="date"
          value={filters.to}
        />
        {selects.map((select) => (
          <Select
            aria-label={select.label}
            key={select.key}
            onChange={(event) => onChange(select.key, event.target.value)}
            value={filters[select.key]}
          >
            <option value="">{select.label}</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ))}
      </div>
      <div className="mt-3 flex min-h-10 items-center justify-between gap-3">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span />}
        <Button onClick={onReset} variant="ghost">
          <FilterX className="size-4" />
          Limpar filtros
        </Button>
      </div>
    </section>
  )
}
