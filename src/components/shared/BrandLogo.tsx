import logo from '@/assets/crm-plus-logo.png'

import { cn } from '@/lib/utils/cn'

type BrandLogoProps = {
  className?: string
  compact?: boolean
}

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <img
      alt="CRM+"
      className={cn('object-contain', compact ? 'size-11' : 'h-auto w-36 sm:w-40', className)}
      src={logo}
    />
  )
}
