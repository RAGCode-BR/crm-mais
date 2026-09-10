import { Search, X } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'

export function SearchInput({
  className,
  onClear,
  value,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { onClear?: () => void }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
      />
      <Input className="pl-9 pr-10" type="search" value={value} {...props} />
      {onClear && value ? (
        <Button
          aria-label="Limpar busca"
          className="absolute right-1 top-1 size-8 px-0"
          onClick={onClear}
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
