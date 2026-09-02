import { render, screen } from '@testing-library/react'

import { FoundationPage } from '@/pages/FoundationPage'

describe('FoundationPage', () => {
  it('descreve a fundação sem antecipar módulos comerciais', () => {
    render(<FoundationPage />)

    expect(screen.getByRole('heading', { name: /CRM\+ preparado/i })).toBeInTheDocument()
    expect(screen.getByText(/Bloco 0/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/Supabase:/i)
  })
})
