import { GitCompareArrows } from 'lucide-react'

import type { FunnelStep } from '../report.types'

export function ConversionFunnel({ steps }: { steps: FunnelStep[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Conversão do funil</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Taxa entre cada marco comercial no período selecionado.
      </p>
      {steps.length ? (
        <div className="mt-5 space-y-4">
          {steps.map((step) => (
            <div key={step.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span>{step.label}</span>
                <span className="font-medium">{step.rate.toLocaleString('pt-BR')}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(2, Math.min(100, step.rate))}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {step.from} na origem · {step.to} no destino
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 text-center text-sm text-muted-foreground">
          <GitCompareArrows className="mx-auto mb-2 size-6" />
          Sem dados suficientes para calcular conversões.
        </div>
      )}
    </section>
  )
}
