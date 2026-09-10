import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/Button'

export function ConfirmDialog({
  confirmLabel = 'Confirmar',
  description,
  onCancel,
  onConfirm,
  open,
  pending = false,
  title,
}: {
  confirmLabel?: string
  description: string
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  pending?: boolean
  title: string
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onCancel()
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [onCancel, open, pending])

  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel()
      }}
    >
      <section
        aria-describedby="confirm-dialog-description"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
        role="alertdialog"
        ref={dialogRef}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200">
            <AlertTriangle aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold" id="confirm-dialog-title">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" id="confirm-dialog-description">
              {description}
            </p>
          </div>
          <Button
            aria-label="Fechar"
            className="size-9 px-0"
            disabled={pending}
            onClick={onCancel}
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={pending} onClick={onCancel} ref={cancelRef} variant="outline">
            Cancelar
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? 'Processando...' : confirmLabel}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
