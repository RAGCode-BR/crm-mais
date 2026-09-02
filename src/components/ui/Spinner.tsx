import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

type SpinnerProps = {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Carregando' }: SpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <LoaderCircle className={cn('size-4 animate-spin', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
