import { AlertTriangle, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { Spinner } from '@/components/ui/Spinner'

export function StatePanel({
  children,
  kind = 'empty',
}: {
  children: ReactNode
  kind?: 'empty' | 'error' | 'loading'
}) {
  const Icon = kind === 'error' ? AlertTriangle : Inbox
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      {kind === 'loading' ? (
        <Spinner className="mx-auto mb-3" />
      ) : (
        <Icon className="mx-auto mb-3 size-6" aria-hidden="true" />
      )}
      <div>{children}</div>
    </div>
  )
}
