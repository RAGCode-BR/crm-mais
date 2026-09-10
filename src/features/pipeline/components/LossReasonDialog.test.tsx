import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LossReasonDialog } from './LossReasonDialog'

describe('LossReasonDialog', () => {
  it('announces the dialog, focuses its field and closes with Escape', () => {
    const onCancel = vi.fn()
    render(
      <LossReasonDialog
        onCancel={onCancel}
        onConfirm={vi.fn()}
        onReasonChange={vi.fn()}
        open
        reason=""
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Motivo da perda' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Motivo da perda' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Confirmar movimento' })).toBeDisabled()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
