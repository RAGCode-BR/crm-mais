import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { DuplicateMatch } from '../crm.types'

export function FormActions({
  backTo,
  duplicates,
  isSaving,
  onConfirm,
}: {
  backTo: string
  duplicates: DuplicateMatch[]
  isSaving: boolean
  onConfirm: () => void
}) {
  return (
    <>
      {duplicates.length ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
          role="alert"
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <strong>Possível duplicidade encontrada</strong>
              <p className="mt-1">
                {duplicates.map((item) => `${item.label} (${item.fields.join(', ')})`).join('; ')}.
                Revise ou confirme para salvar mesmo assim.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
          to={backTo}
        >
          Cancelar
        </Link>
        {duplicates.length ? (
          <Button disabled={isSaving} onClick={onConfirm} variant="outline">
            Salvar mesmo assim
          </Button>
        ) : (
          <Button disabled={isSaving} type="submit">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        )}
      </div>
    </>
  )
}
