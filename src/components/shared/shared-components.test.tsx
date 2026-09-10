import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from './ConfirmDialog'
import { SearchInput } from './SearchInput'
import { UserAvatar } from './UserAvatar'

describe('shared UX components', () => {
  it('confirms and cancels destructive actions accessibly', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        description="Esta ação não pode ser desfeita."
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Excluir registro?"
      />,
    )
    expect(screen.getByRole('alertdialog', { name: 'Excluir registro?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('clears a populated search', () => {
    const onClear = vi.fn()
    render(<SearchInput aria-label="Buscar" onClear={onClear} readOnly value="cliente" />)
    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('renders user initials', () => {
    render(<UserAvatar name="Maria Souza" />)
    expect(screen.getByLabelText('Avatar de Maria Souza')).toHaveTextContent('MS')
  })
})
