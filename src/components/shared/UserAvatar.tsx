import { UserRound } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export function UserAvatar({ className, name }: { className?: string; name?: string | null }) {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return (
    <span
      aria-label={name ? `Avatar de ${name}` : 'Usuário'}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary',
        className,
      )}
    >
      {initials || <UserRound aria-hidden="true" className="size-4" />}
    </span>
  )
}
