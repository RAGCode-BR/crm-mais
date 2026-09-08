import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { useOrganization } from '@/features/organizations/useOrganization'

import { useCommercialAi } from '../ai.hooks'
import { AiResponsePanel } from './AiResponsePanel'

export function CompanySummaryPanel({ companyId }: { companyId: string }) {
  const { activeOrganization } = useOrganization()
  const ai = useCommercialAi()
  const organizationId = activeOrganization?.organizationId
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-primary" /> Resumo inteligente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consolida contatos, oportunidades, tarefas, notas e atividades desta empresa.
          </p>
        </div>
        <Button
          disabled={!organizationId || ai.isPending}
          onClick={() =>
            organizationId && ai.mutate({ mode: 'company_summary', organizationId, companyId })
          }
        >
          <Sparkles className="size-4" />
          {ai.isPending ? 'Resumindo...' : 'Resumir todo o histórico'}
        </Button>
      </div>
      {ai.error ? <p className="text-sm text-red-600">{ai.error.message}</p> : null}
      {ai.data ? <AiResponsePanel response={ai.data} /> : null}
    </section>
  )
}
