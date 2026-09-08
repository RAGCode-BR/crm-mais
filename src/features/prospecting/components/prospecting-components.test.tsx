import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { ProspectingListItem } from '@/types/database/prospecting'

import { ProspectingItemTable } from './ProspectingItemTable'
import { ProspectingListCard } from './ProspectingListCard'

const timestamps = {
  created_at: '2026-09-08T12:00:00.000Z',
  updated_at: '2026-09-08T12:00:00.000Z',
  created_by: null,
}

describe('prospecting components', () => {
  it('shows list productivity totals', () => {
    render(
      <MemoryRouter>
        <ProspectingListCard
          list={{
            ...timestamps,
            id: 'list-1',
            organization_id: 'organization-1',
            name: 'Construção civil — São Paulo',
            description: 'Contas prioritárias',
            owner_member_id: 'member-1',
            status: 'active',
            itemCount: 18,
            contactedCount: 7,
            qualifiedCount: 3,
          }}
          members={[{ value: 'member-1', label: 'Ana Comercial' }]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('Construção civil — São Paulo')).toBeInTheDocument()
    expect(screen.getByText('18 registros')).toBeInTheDocument()
    expect(screen.getByText('7 contatados')).toBeInTheDocument()
    expect(screen.getByText('3 qualificados')).toBeInTheDocument()
  })

  it('renders a mixed list item with its tags and owner', () => {
    const item: ProspectingListItem & {
      entityKind: 'lead'
      entityLabel: string
      entityDescription: string
      tagIds: string[]
    } = {
      ...timestamps,
      id: 'item-1',
      organization_id: 'organization-1',
      list_id: 'list-1',
      company_id: null,
      lead_id: 'lead-1',
      assigned_member_id: 'member-1',
      status: 'contacted',
      last_action_at: null,
      entityKind: 'lead',
      entityLabel: 'Lead prioritário',
      entityDescription: 'lead@example.com',
      tagIds: ['tag-1'],
    }
    render(
      <MemoryRouter>
        <ProspectingItemTable
          items={[item]}
          members={[{ value: 'member-1', label: 'Ana Comercial' }]}
          onSelectionChange={() => undefined}
          selectedIds={[]}
          tags={[{ value: 'tag-1', label: 'Prioridade', color: '#2563EB' }]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('Lead prioritário')).toBeInTheDocument()
    expect(screen.getByText('Ana Comercial')).toBeInTheDocument()
    expect(screen.getByText('Prioridade')).toBeInTheDocument()
    expect(screen.getByText('Contatado')).toBeInTheDocument()
  })
})
