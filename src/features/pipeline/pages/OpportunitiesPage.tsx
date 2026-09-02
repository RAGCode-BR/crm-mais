import { Plus, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import type { PipelineStage } from '@/types/database/pipeline'
import { OpportunityCard } from '../components/OpportunityCard'
import { opportunityStatusOptions, pipelineCanManage } from '../pipeline.constants'
import { useKanbanOpportunities, useMoveOpportunity, usePipelineLookups } from '../pipeline.hooks'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function OpportunitiesPage() {
  const { activeOrganization } = useOrganization()
  const [params, setParams] = useSearchParams()
  const [pendingMove, setPendingMove] = useState<{ opportunityId: string; stageId: string } | null>(
    null,
  )
  const [lossReason, setLossReason] = useState('')
  const organizationId = activeOrganization?.organizationId ?? ''
  const lookups = usePipelineLookups(organizationId)
  const requestedPipelineId = params.get('pipeline')
  const selectedPipelineId =
    lookups.data?.pipelines.find((item) => item.id === requestedPipelineId)?.id ??
    lookups.data?.pipelines.find((item) => item.is_default)?.id ??
    lookups.data?.pipelines[0]?.id ??
    ''
  const filters = {
    search: params.get('busca') ?? '',
    ownerId: params.get('responsavel') ?? '',
    status: params.get('estado') ?? '',
  }
  const opportunities = useKanbanOpportunities(organizationId, selectedPipelineId, filters)
  const move = useMoveOpportunity(organizationId, selectedPipelineId, filters)
  const pipeline = lookups.data?.pipelines.find((item) => item.id === selectedPipelineId)
  const companyNames = new Map(
    (lookups.data?.companies ?? []).map((item) => [item.value, item.label]),
  )
  const canMove = roleCanWrite(activeOrganization?.role)
  const update = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  const requestMove = (opportunityId: string, stage: PipelineStage) => {
    if (stage.is_lost) {
      setPendingMove({ opportunityId, stageId: stage.id })
      setLossReason('')
      return
    }
    move.mutate({ opportunityId, stageId: stage.id })
  }
  if (lookups.isLoading) return <StatePanel kind="loading">Carregando pipeline...</StatePanel>
  if (lookups.error) return <StatePanel kind="error">{lookups.error.message}</StatePanel>
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            {pipelineCanManage(activeOrganization?.role) ? (
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium"
                to="/pipelines"
              >
                <Settings2 className="size-4" />
                Configurar pipelines
              </Link>
            ) : null}
            {canMove ? (
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                to="/oportunidades/nova"
              >
                <Plus className="size-4" />
                Nova oportunidade
              </Link>
            ) : null}
          </>
        }
        description="Arraste os cards entre as etapas ou use o seletor em cada oportunidade."
        title="Pipeline de oportunidades"
      />
      {!lookups.data?.pipelines.length ? (
        <StatePanel>Nenhum pipeline ativo disponível.</StatePanel>
      ) : (
        <>
          <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
            <Select
              aria-label="Pipeline"
              onChange={(event) => update('pipeline', event.target.value)}
              value={selectedPipelineId}
            >
              {lookups.data.pipelines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Input
              aria-label="Buscar oportunidades"
              onChange={(event) => update('busca', event.target.value)}
              placeholder="Buscar oportunidade..."
              value={filters.search}
            />
            <Select
              aria-label="Responsável"
              onChange={(event) => update('responsavel', event.target.value)}
              value={filters.ownerId}
            >
              <option value="">Todos os responsáveis</option>
              {lookups.data.members.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Estado"
              onChange={(event) => update('estado', event.target.value)}
              value={filters.status}
            >
              <option value="">Todos os estados</option>
              {opportunityStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </section>
          {opportunities.isLoading ? (
            <StatePanel kind="loading">Carregando oportunidades...</StatePanel>
          ) : opportunities.error ? (
            <StatePanel kind="error">{opportunities.error.message}</StatePanel>
          ) : (
            <div className="overflow-x-auto pb-3">
              <div className="flex min-w-max gap-4">
                {pipeline?.stages.map((stage) => {
                  const cards = (opportunities.data ?? []).filter(
                    (item) => item.stage_id === stage.id,
                  )
                  const total = cards.reduce((sum, item) => sum + Number(item.estimated_value), 0)
                  return (
                    <section
                      className="w-80 shrink-0 rounded-xl bg-muted/60 p-3"
                      key={stage.id}
                      onDragOver={(event) => {
                        if (canMove) {
                          event.preventDefault()
                          event.dataTransfer.dropEffect = 'move'
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const opportunityId = event.dataTransfer.getData('text/opportunity-id')
                        if (opportunityId) requestMove(opportunityId, stage)
                      }}
                    >
                      <header className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-semibold">{stage.name}</h2>
                          <p className="text-xs text-muted-foreground">
                            {cards.length} · {currency.format(total)}
                          </p>
                        </div>
                        <span className="rounded-full bg-card px-2 py-1 text-xs">
                          {stage.default_probability}%
                        </span>
                      </header>
                      <div className="space-y-3">
                        {cards.map((opportunity) => (
                          <OpportunityCard
                            canMove={canMove}
                            companyName={companyNames.get(opportunity.company_id) ?? 'Empresa'}
                            key={opportunity.id}
                            onMove={(stageId) => {
                              const target = pipeline.stages.find((item) => item.id === stageId)
                              if (target) requestMove(opportunity.id, target)
                            }}
                            opportunity={opportunity}
                            stages={pipeline.stages}
                          />
                        ))}
                        {cards.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                            Solte uma oportunidade aqui
                          </div>
                        ) : null}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
      {move.error ? <StatePanel kind="error">{move.error.message}</StatePanel> : null}
      {pendingMove ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <section className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Motivo da perda</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe o motivo antes de mover para uma etapa perdida.
            </p>
            <Input
              autoFocus
              className="mt-4"
              onChange={(event) => setLossReason(event.target.value)}
              placeholder="Ex.: orçamento insuficiente"
              value={lossReason}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setPendingMove(null)} variant="ghost">
                Cancelar
              </Button>
              <Button
                disabled={!lossReason.trim()}
                onClick={() => {
                  move.mutate({
                    opportunityId: pendingMove.opportunityId,
                    stageId: pendingMove.stageId,
                    lossReason,
                  })
                  setPendingMove(null)
                }}
              >
                Confirmar movimento
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
