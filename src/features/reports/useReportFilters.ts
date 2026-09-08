import { useSearchParams } from 'react-router-dom'

import type { ReportFilters } from './report.types'

function dateValue(date: Date) {
  const local = new Date(date)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}

export function useReportFilters() {
  const [params, setParams] = useSearchParams()
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  const filters: ReportFilters = {
    from: params.get('inicio') ?? dateValue(start),
    to: params.get('fim') ?? dateValue(end),
    ownerId: params.get('responsavel') ?? '',
    teamId: params.get('equipe') ?? '',
    sourceId: params.get('origem') ?? '',
    industry: params.get('segmento') ?? '',
    product: params.get('produto') ?? '',
    pipelineId: params.get('pipeline') ?? '',
  }
  const names: Record<keyof ReportFilters, string> = {
    from: 'inicio',
    to: 'fim',
    ownerId: 'responsavel',
    teamId: 'equipe',
    sourceId: 'origem',
    industry: 'segmento',
    product: 'produto',
    pipelineId: 'pipeline',
  }
  const update = (key: keyof ReportFilters, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        const name = names[key]
        if (value) next.set(name, value)
        else next.delete(name)
        return next
      },
      { replace: true },
    )
  return {
    filters,
    queryString: params.toString(),
    update,
    reset: () => setParams({}, { replace: true }),
  }
}
