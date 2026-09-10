import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { StatePanel } from '@/components/shared/StatePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrganization } from '@/features/organizations/useOrganization'
import { AUDIT_PAGE_SIZE, auditActionLabels, auditEntityLabels } from '../audit.constants'
import { useAuditActors, useAuditLogs } from '../audit.hooks'
import { AuditLogCard } from '../components/AuditLogCard'
import type { AuditFilters } from '../audit.types'

const managementRoles = new Set(['owner', 'admin', 'manager'])

export function AuditPage() {
  const { activeOrganization } = useOrganization()
  const [filters, setFilters] = useState<AuditFilters>({
    action: '',
    actorMemberId: '',
    entityType: '',
    from: '',
    page: 1,
    pageSize: AUDIT_PAGE_SIZE,
    to: '',
  })
  const organizationId = activeOrganization?.organizationId
  const allowed = managementRoles.has(activeOrganization?.role ?? '')
  const query = useAuditLogs(allowed ? organizationId : undefined, filters)
  const actors = useAuditActors(allowed ? organizationId : undefined)
  const update = (key: keyof AuditFilters, value: string | number) =>
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? Number(value) : 1,
    }))

  if (!allowed)
    return (
      <StatePanel kind="error">Seu perfil não possui acesso aos registros de auditoria.</StatePanel>
    )
  return (
    <div className="space-y-6">
      <PageHeader
        description="Histórico protegido das operações importantes realizadas na organização."
        title="Auditoria"
      />
      <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
        <Select
          aria-label="Entidade auditada"
          onChange={(event) => update('entityType', event.target.value)}
          value={filters.entityType}
        >
          <option value="">Todas as entidades</option>
          {Object.entries(auditEntityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Ação auditada"
          onChange={(event) => update('action', event.target.value)}
          value={filters.action}
        >
          <option value="">Todas as ações</option>
          {Object.entries(auditActionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Usuário responsável"
          onChange={(event) => update('actorMemberId', event.target.value)}
          value={filters.actorMemberId}
        >
          <option value="">Todos os usuários</option>
          {actors.data?.map((actor) => (
            <option key={actor.value} value={actor.value}>
              {actor.label}
            </option>
          ))}
        </Select>
        <Input
          aria-label="Data inicial da auditoria"
          onChange={(event) => update('from', event.target.value)}
          type="date"
          value={filters.from}
        />
        <Input
          aria-label="Data final da auditoria"
          onChange={(event) => update('to', event.target.value)}
          type="date"
          value={filters.to}
        />
      </section>
      {query.isLoading || actors.isLoading ? (
        <StatePanel kind="loading">Carregando registros de auditoria...</StatePanel>
      ) : query.error || actors.error ? (
        <StatePanel kind="error">{query.error?.message ?? actors.error?.message}</StatePanel>
      ) : query.data?.items.length ? (
        <section className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {query.data.items.map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))}
          <Pagination
            count={query.data.count}
            onChange={(page) => update('page', page)}
            page={filters.page}
            pageSize={filters.pageSize}
          />
        </section>
      ) : (
        <StatePanel>
          <ShieldCheck className="mx-auto mb-3 size-7" />
          <p className="font-medium text-foreground">Nenhum evento encontrado</p>
          <p className="mt-1">As próximas operações importantes aparecerão aqui automaticamente.</p>
        </StatePanel>
      )}
    </div>
  )
}
