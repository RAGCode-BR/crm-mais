import { CalendarRange, ChevronDown, Filter, FilterX, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
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
  const [isOpen, setIsOpen] = useState(false)
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
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          aria-controls="dashboard-filters"
          aria-expanded={isOpen}
          className="rounded-xl border-blue-100 bg-white text-slate-700 shadow-sm shadow-slate-950/[0.03] hover:bg-blue-50 hover:text-blue-700 dark:border-blue-950 dark:bg-card dark:text-foreground dark:hover:bg-blue-950/30"
          onClick={() => setIsOpen((open) => !open)}
          variant="outline"
        >
          <Filter className="size-4 text-blue-600" aria-hidden="true" />
          Filtros e período
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          <CalendarRange className="size-3.5" aria-hidden="true" /> Período selecionado
        </span>
      </div>
      {isOpen ? (
        <div
          className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-slate-950/[0.025] sm:p-5"
          id="dashboard-filters"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Ajuste sua visualização</h2>
              <p className="text-xs text-muted-foreground">
                Os indicadores são atualizados automaticamente.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              aria-label="Data inicial"
              className="border-blue-100 bg-blue-50/30 focus-visible:ring-blue-500 dark:border-blue-950"
              onChange={(event) => onChange('from', event.target.value)}
              type="date"
              value={filters.from}
            />
            <Input
              aria-label="Data final"
              className="border-blue-100 bg-blue-50/30 focus-visible:ring-blue-500 dark:border-blue-950"
              onChange={(event) => onChange('to', event.target.value)}
              type="date"
              value={filters.to}
            />
            {selects.map((select) => (
              <Select
                aria-label={select.label}
                className="border-slate-200 bg-slate-50/50 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
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
            <Button
              className="text-muted-foreground hover:text-foreground"
              onClick={onReset}
              variant="ghost"
            >
              <FilterX className="size-4" />
              Limpar filtros
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
