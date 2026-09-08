import type { ReactNode } from 'react'

export function StateXs({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'error'
}) {
  return (
    <p
      className={
        tone === 'error'
          ? 'rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300'
          : 'rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground'
      }
    >
      {children}
    </p>
  )
}
