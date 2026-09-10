import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LossReasonDialog({
  onCancel,
  onConfirm,
  onReasonChange,
  open,
  reason,
}: {
  onCancel: () => void
  onConfirm: () => void
  onReasonChange: (value: string) => void
  open: boolean
  reason: string
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyboard)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyboard)
      previousFocusRef.current?.focus()
    }
  }, [onCancel, open])

  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <section
        aria-describedby="loss-reason-description"
        aria-labelledby="loss-reason-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
        ref={dialogRef}
        role="dialog"
      >
        <h2 className="text-lg font-semibold" id="loss-reason-title">
          Motivo da perda
        </h2>
        <p className="mt-1 text-sm text-muted-foreground" id="loss-reason-description">
          Informe o motivo antes de mover para uma etapa perdida.
        </p>
        <label className="sr-only" htmlFor="loss-reason-input">
          Motivo da perda
        </label>
        <Input
          className="mt-4"
          id="loss-reason-input"
          maxLength={250}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Ex.: orçamento insuficiente"
          value={reason}
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <Button disabled={!reason.trim()} onClick={onConfirm}>
            Confirmar movimento
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
