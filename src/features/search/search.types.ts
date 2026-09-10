export type SearchEntityType = 'company' | 'contact' | 'lead' | 'opportunity' | 'task'

export type GlobalSearchResult = {
  entityType: SearchEntityType
  entityId: string
  title: string
  subtitle: string
  path: string
  rank: number
  updatedAt: string
}

export type GlobalSearchParams = {
  organizationId: string
  query: string
  limit?: number
}

export interface GlobalSearchProvider {
  search(params: GlobalSearchParams): Promise<GlobalSearchResult[]>
}
