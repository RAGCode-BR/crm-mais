import type { GlobalSearchResult } from './search.types'
import { groupSearchResults } from './search.utils'

const result = (entityType: GlobalSearchResult['entityType'], title: string) => ({
  entityType,
  entityId: crypto.randomUUID(),
  title,
  subtitle: entityType,
  path: `/${entityType}`,
  rank: 1,
  updatedAt: '2026-09-08T18:00:00.000Z',
})

describe('groupSearchResults', () => {
  it('preserves relevance order inside entity groups', () => {
    const groups = groupSearchResults([
      result('company', 'Therapeutica'),
      result('contact', 'João'),
      result('company', 'Therapeutica Labs'),
    ])
    expect(groups.map(([type]) => type)).toEqual(['company', 'contact'])
    expect(groups[0]?.[1].map(({ title }) => title)).toEqual(['Therapeutica', 'Therapeutica Labs'])
  })
})
