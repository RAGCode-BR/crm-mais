import { CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { AiResponse } from '../ai.types'

export function AiResponsePanel({ response }: { response: AiResponse }) {
  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Análise gerada</p>
        <h2 className="mt-1 text-xl font-semibold">{response.title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {response.answer}
        </p>
      </div>
      {response.evidence.length ? (
        <div>
          <h3 className="text-sm font-medium">Evidências consideradas</h3>
          <ul className="mt-2 space-y-2">
            {response.evidence.map((item) => (
              <li className="flex gap-2 text-sm text-muted-foreground" key={item}>
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {response.suggestedActions.length ? (
        <div>
          <h3 className="text-sm font-medium">Ações sugeridas</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {response.suggestedActions.map((action) => (
              <div
                className="rounded-lg border border-border p-4"
                key={`${action.path}-${action.label}`}
              >
                <p className="font-medium">{action.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{action.reason}</p>
                <Link
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  to={action.path}
                >
                  Revisar ação <ExternalLink className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-primary" />A IA não executa contatos,
        alterações ou movimentações. Revise os dados e confirme qualquer ação comercial na tela de
        destino.
      </div>
      <p className="text-xs text-muted-foreground">
        Gerado em {new Date(response.generatedAt).toLocaleString('pt-BR')} · {response.provider} /{' '}
        {response.model}
      </p>
    </section>
  )
}
