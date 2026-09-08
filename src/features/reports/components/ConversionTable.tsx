import type { ConversionPoint } from '../report.types'

export function ConversionTable({
  description,
  rows,
  title,
}: {
  description: string
  rows: ConversionPoint[]
  title: string
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {rows.length ? (
        <div className="mt-5 divide-y divide-border">
          {rows.slice(0, 10).map((row) => (
            <div className="flex items-center justify-between gap-4 py-3" key={row.label}>
              <div className="min-w-0">
                <p className="truncate font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">
                  {row.won} ganhos de {row.total} encerrados
                </p>
              </div>
              <span className="font-semibold">{row.rate.toLocaleString('pt-BR')}%</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">Sem dados no período selecionado.</p>
      )}
    </section>
  )
}
