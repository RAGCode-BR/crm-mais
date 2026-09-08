import {
  BrainCircuit,
  CalendarClock,
  Flame,
  Settings2,
  ThermometerSun,
  UserRoundX,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { useOrganization } from '@/features/organizations/useOrganization'

import { ScoredLeadList } from '../components/ScoredLeadList'
import { useRecalculateLeadScores, useScoringInsights } from '../scoring.hooks'

export function LeadScoringPage() {
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const query = useScoringInsights(activeOrganization?.organizationId)
  const recalculate = useRecalculateLeadScores(organizationId)
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium"
              to="/inteligencia/scoring/regras"
            >
              <Settings2 className="size-4" /> Regras de score
            </Link>
            {activeOrganization?.role !== 'viewer' ? (
              <Button
                disabled={recalculate.isPending}
                onClick={() => recalculate.mutate()}
                variant="outline"
              >
                <BrainCircuit className="size-4" />{' '}
                {recalculate.isPending ? 'Recalculando...' : 'Recalcular scores'}
              </Button>
            ) : null}
          </>
        }
        description="Sinais de prioridade calculados por regras configuráveis para apoiar decisões comerciais."
        title="Lead scoring"
      />
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        O score é um apoio à tomada de decisão. Contexto comercial e julgamento humano continuam
        sendo essenciais.
      </p>
      {query.isLoading ? (
        <StatePanel kind="loading">Calculando prioridades...</StatePanel>
      ) : query.error ? (
        <StatePanel kind="error">{query.error.message}</StatePanel>
      ) : query.data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Leads avaliados</p>
              <p className="mt-2 text-2xl font-semibold">{query.data.leads.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Muito quentes</p>
              <p className="mt-2 text-2xl font-semibold">
                {query.data.leads.filter(({ score }) => score >= 80).length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Quentes</p>
              <p className="mt-2 text-2xl font-semibold">
                {query.data.leads.filter(({ score }) => score >= 60 && score < 80).length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Mornos</p>
              <p className="mt-2 text-2xl font-semibold">{query.data.warming.length}</p>
            </div>
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            <ScoredLeadList
              description="Score elevado com próximo contato previsto até hoje."
              empty="Nenhum lead prioritário para hoje."
              icon={CalendarClock}
              leads={query.data.priorityToday}
              title="Leads prioritários hoje"
            />
            <ScoredLeadList
              description="Leads entre 40 e 59 pontos que demonstram potencial crescente."
              empty="Nenhum lead aquecendo agora."
              icon={ThermometerSun}
              leads={query.data.warming}
              title="Leads aquecendo"
            />
            <ScoredLeadList
              description="Leads sem atividade registrada ou sem movimentação há 30 dias."
              empty="Nenhum lead sem atividade relevante."
              icon={UserRoundX}
              leads={query.data.inactive}
              title="Leads sem atividade"
            />
            <ScoredLeadList
              description="Score a partir de 60 sem tarefa pendente ou em andamento."
              empty="Todos os leads de score alto possuem acompanhamento."
              icon={Flame}
              leads={query.data.highWithoutFollowUp}
              title="Score alto sem follow-up"
            />
          </section>
        </>
      ) : null}
      {recalculate.error ? <StatePanel kind="error">{recalculate.error.message}</StatePanel> : null}
    </div>
  )
}
