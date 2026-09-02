import { CheckCircle2, GitBranch, Pencil, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'
import { pipelineCanManage } from '../pipeline.constants'
import { usePipelines } from '../pipeline.hooks'

export function PipelinesPage() {
  const { activeOrganization } = useOrganization()
  const query = usePipelines(activeOrganization?.organizationId)
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          pipelineCanManage(activeOrganization?.role) ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              to="/pipelines/novo"
            >
              <Plus className="size-4" />
              Novo pipeline
            </Link>
          ) : undefined
        }
        description="Configure múltiplos fluxos e suas etapas comerciais."
        title="Pipelines"
      />
      {query.isLoading ? (
        <StatePanel kind="loading">Carregando pipelines...</StatePanel>
      ) : query.error ? (
        <StatePanel kind="error">{query.error.message}</StatePanel>
      ) : query.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((pipeline) => (
            <article className="rounded-xl border border-border bg-card p-5" key={pipeline.id}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-muted">
                  <GitBranch className="size-5" />
                </span>
                <div className="flex gap-2">
                  {pipeline.is_default ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                      <CheckCircle2 className="size-3" />
                      Padrão
                    </span>
                  ) : null}
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    {pipeline.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <h2 className="mt-4 font-semibold">{pipeline.name}</h2>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                {pipeline.description ?? 'Sem descrição'}
              </p>
              <p className="mt-4 text-sm">
                <strong>{pipeline.stages.length}</strong> etapas
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-border text-sm font-medium"
                  to={`/oportunidades?pipeline=${pipeline.id}`}
                >
                  Abrir Kanban
                </Link>
                {pipelineCanManage(activeOrganization?.role) ? (
                  <Link
                    aria-label={`Editar ${pipeline.name}`}
                    className="inline-flex size-9 items-center justify-center rounded-md border border-border"
                    to={`/pipelines/${pipeline.id}/editar`}
                  >
                    <Pencil className="size-4" />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <StatePanel>Nenhum pipeline encontrado.</StatePanel>
      )}
    </div>
  )
}
