import { BellRing, RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useOrganization } from '@/features/organizations/useOrganization'

import { PriorityCard } from '../components/PriorityCard'
import { recommendationCategories, recommendationPriorities } from '../recommendation.constants'
import { useCommercialRecommendations } from '../recommendation.hooks'

export function PrioritiesPage() {
  const { activeOrganization } = useOrganization()
  const [params, setParams] = useSearchParams()
  const query = useCommercialRecommendations(activeOrganization?.organizationId)
  const filters = {
    priority: params.get('prioridade') ?? '',
    category: params.get('categoria') ?? '',
    ownerId: params.get('responsavel') ?? '',
  }
  const setFilter = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  const recommendations = (query.data?.recommendations ?? []).filter(
    (item) =>
      (!filters.priority || item.priority === filters.priority) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.ownerId || item.ownerMemberId === filters.ownerId),
  )
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            variant="outline"
          >
            <RefreshCw className="size-4" />{' '}
            {query.isFetching ? 'Atualizando...' : 'Atualizar prioridades'}
          </Button>
        }
        description="Alertas explicáveis para decidir o próximo passo comercial. Nenhuma ação é executada automaticamente."
        title="Prioridades de hoje"
      />
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
        <Select
          aria-label="Prioridade"
          onChange={(event) => setFilter('prioridade', event.target.value)}
          value={filters.priority}
        >
          <option value="">Todas as prioridades</option>
          {recommendationPriorities.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Categoria"
          onChange={(event) => setFilter('categoria', event.target.value)}
          value={filters.category}
        >
          <option value="">Todas as categorias</option>
          {recommendationCategories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Responsável"
          onChange={(event) => setFilter('responsavel', event.target.value)}
          value={filters.ownerId}
        >
          <option value="">Todos os responsáveis</option>
          {query.data?.members.map((member) => (
            <option key={member.value} value={member.value}>
              {member.label}
            </option>
          ))}
        </Select>
      </div>
      {query.isLoading ? (
        <StatePanel kind="loading">Analisando leads, tarefas e oportunidades...</StatePanel>
      ) : query.error ? (
        <StatePanel kind="error">{query.error.message}</StatePanel>
      ) : recommendations.length ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Prioridades encontradas</p>
              <p className="mt-2 text-2xl font-semibold">{recommendations.length}</p>
            </div>
            {recommendationPriorities.slice(0, 3).map((priority) => (
              <div className="rounded-xl border border-border bg-card p-4" key={priority.value}>
                <p className="text-xs text-muted-foreground">{priority.label}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {recommendations.filter((item) => item.priority === priority.value).length}
                </p>
              </div>
            ))}
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            {recommendations.map((recommendation) => (
              <PriorityCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </section>
        </>
      ) : (
        <StatePanel>
          <BellRing className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhuma prioridade nesta visão</p>
          <p className="mt-1">
            O motor não encontrou situações que correspondam aos filtros e regras atuais.
          </p>
        </StatePanel>
      )}
    </div>
  )
}
