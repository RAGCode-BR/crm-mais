import type { GlobalSearchResult, SearchEntityType } from './search.types'

export const searchEntityLabels: Record<SearchEntityType, string> = {
  company: 'Empresas',
  contact: 'Contatos',
  lead: 'Leads',
  opportunity: 'Oportunidades',
  task: 'Tarefas',
}

export function groupSearchResults(results: GlobalSearchResult[]) {
  const grouped = new Map<SearchEntityType, GlobalSearchResult[]>()
  for (const result of results) {
    const group = grouped.get(result.entityType) ?? []
    group.push(result)
    grouped.set(result.entityType, group)
  }
  return [...grouped.entries()]
}
