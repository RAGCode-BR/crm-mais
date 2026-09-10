import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

const variants = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
} as const

export function StatusBadge({
  children,
  className,
  variant = 'neutral',
}: {
  children: ReactNode
  className?: string
  variant?: keyof typeof variants
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
