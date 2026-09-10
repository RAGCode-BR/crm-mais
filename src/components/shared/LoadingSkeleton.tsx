export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      aria-label="Carregando conteúdo"
      aria-live="polite"
      className="space-y-3 rounded-xl border border-border bg-card p-5"
      role="status"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div className="animate-pulse space-y-2" key={index}>
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      ))}
      <span className="sr-only">Carregando...</span>
    </div>
  )
}
