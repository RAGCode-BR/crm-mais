import { ArrowLeft, Pencil, Plus, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useOrganization } from '@/features/organizations/useOrganization'

import { CadenceStepsTimeline } from '../components/CadenceStepsTimeline'
import { EnrollLeadsPanel } from '../components/EnrollLeadsPanel'
import { EnrollmentList } from '../components/EnrollmentList'
import {
  cadenceCanManage,
  cadenceEnrollmentStatuses,
  cadenceStatusLabel,
} from '../cadence.constants'
import { useCadenceDetails, useCadenceLookups } from '../cadence.hooks'

const pageSize = 20

export function CadenceDetailsPage() {
  const { cadenceId } = useParams()
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId
  const canWrite = Boolean(activeOrganization && activeOrganization.role !== 'viewer')
  const [params, setParams] = useSearchParams()
  const [enrolling, setEnrolling] = useState(false)
  const filters = {
    page: Math.max(1, Number(params.get('pagina') ?? '1') || 1),
    pageSize,
    status: params.get('status') ?? '',
  }
  const query = useCadenceDetails(organizationId, cadenceId, filters)
  const lookups = useCadenceLookups(organizationId)
  const setFilter = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'pagina') next.delete('pagina')
        return next
      },
      { replace: true },
    )
  if (!organizationId || !cadenceId || query.isLoading)
    return <StatePanel kind="loading">Carregando cadência...</StatePanel>
  if (query.error) return <StatePanel kind="error">{query.error.message}</StatePanel>
  const { cadence, steps, enrollments } = query.data!
  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        to="/cadencias"
      >
        <ArrowLeft className="size-4" /> Voltar para cadências
      </Link>
      <PageHeader
        actions={
          <>
            {cadenceCanManage(activeOrganization?.role) ? (
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium"
                to={`/cadencias/${cadenceId}/editar`}
              >
                <Pencil className="size-4" /> Editar
              </Link>
            ) : null}
            {canWrite && cadence.status === 'active' ? (
              <Button onClick={() => setEnrolling(true)}>
                <Plus className="size-4" /> Adicionar leads
              </Button>
            ) : null}
          </>
        }
        description={cadence.description ?? 'Sequência comercial sem descrição.'}
        title={cadence.name}
      />
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-muted px-3 py-1">
          {cadenceStatusLabel(cadence.status)}
        </span>
        <span className="rounded-full bg-muted px-3 py-1">{steps.length} etapas</span>
        <span className="rounded-full bg-muted px-3 py-1">{enrollments.count} inscrições</span>
      </div>
      {enrolling && lookups.data ? (
        <EnrollLeadsPanel
          cadenceId={cadenceId}
          lookups={lookups.data}
          onClose={() => setEnrolling(false)}
          organizationId={organizationId}
        />
      ) : null}
      {lookups.error ? <StatePanel kind="error">{lookups.error.message}</StatePanel> : null}
      <CadenceStepsTimeline steps={steps} />
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Leads na cadência</h2>
            <p className="text-sm text-muted-foreground">
              Pause, retome ou remova uma participação sem disparar mensagens externas.
            </p>
          </div>
          <Select
            className="max-w-52"
            onChange={(event) => setFilter('status', event.target.value)}
            value={filters.status}
          >
            <option value="">Todos os status</option>
            {cadenceEnrollmentStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        {enrollments.rows.length ? (
          <>
            <EnrollmentList
              canWrite={canWrite}
              enrollments={enrollments.rows}
              organizationId={organizationId}
            />
            <Pagination
              count={enrollments.count}
              onChange={(page) => setFilter('pagina', String(page))}
              page={filters.page}
              pageSize={pageSize}
            />
          </>
        ) : (
          <StatePanel>
            <UsersRound className="mx-auto mb-3 size-7 text-muted-foreground" />
            Nenhum lead nesta visão.
          </StatePanel>
        )}
      </section>
    </div>
  )
}
