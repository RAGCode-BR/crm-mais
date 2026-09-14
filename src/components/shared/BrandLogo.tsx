import icon from '@/assets/crm-plus-icon.png'
import logo from '@/assets/crm-plus-logo.png'

import { cn } from '@/lib/utils/cn'

type BrandLogoProps = {
  className?: string
  compact?: boolean
}

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <img alt="" aria-hidden="true" className="size-9 object-contain" src={icon} />
        <span className="text-lg font-bold tracking-tight text-foreground">
          CRM<span className="text-emerald-500">+</span>
        </span>
      </span>
    )
  }

  return (
    <img alt="CRM+" className={cn('h-auto w-36 object-contain sm:w-40', className)} src={logo} />
  )
}
