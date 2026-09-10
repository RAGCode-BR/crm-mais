import { supabase } from '@/lib/supabase/client'

import type { GlobalSearchParams, GlobalSearchProvider, GlobalSearchResult } from './search.types'

const postgresSearchProvider: GlobalSearchProvider = {
  async search({ limit = 25, organizationId, query }: GlobalSearchParams) {
    if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
    const result = await supabase.rpc('search_global', {
      target_organization_id: organizationId,
      search_text: query,
      result_limit: limit,
    })
    if (result.error) throw result.error
    return (result.data ?? []).map((row): GlobalSearchResult => ({
      entityType: row.entity_type,
      entityId: row.entity_id,
      title: row.title,
      subtitle: row.subtitle,
      path: row.action_path,
      rank: row.rank,
      updatedAt: row.updated_at,
    }))
  },
}

// The UI depends on this contract rather than on PostgreSQL details. A future semantic or hybrid
// provider can implement GlobalSearchProvider without changing the command palette.
export const globalSearchProvider: GlobalSearchProvider = postgresSearchProvider
