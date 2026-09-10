import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GlobalSearchPalette } from './GlobalSearchPalette'

vi.mock('@/features/organizations/useOrganization', () => ({
  useOrganization: () => ({
    activeOrganization: { organizationId: '10000000-0000-4000-8000-000000000001' },
  }),
}))

vi.mock('../search.hooks', () => ({
  useGlobalSearch: () => ({ data: [], isLoading: false, error: null }),
}))

function Harness() {
  const [open, setOpen] = useState(false)
  return <GlobalSearchPalette onOpenChange={setOpen} open={open} />
}

describe('GlobalSearchPalette', () => {
  it('opens with Ctrl+K and focuses the search input', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.keyboard('{Control>}k{/Control}')
    expect(screen.getByRole('dialog', { name: 'Busca global' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Pesquisar em todo o CRM' })).toHaveFocus()
  })
})
