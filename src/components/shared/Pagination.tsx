import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Pagination({
  count,
  page,
  pageSize,
  onChange,
}: {
  count: number
  page: number
  pageSize: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        {count} registro{count === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Página anterior"
          className="size-9 px-0"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span>
          Página {page} de {pages}
        </span>
        <Button
          aria-label="Próxima página"
          className="size-9 px-0"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
