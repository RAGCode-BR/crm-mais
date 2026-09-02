import { ArrowUpDown, Plus, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { StatePanel } from '@/components/shared/StatePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrganization } from '@/features/organizations/useOrganization'

import {
  PAGE_SIZE,
  companyStatusOptions,
  leadStatusOptions,
  roleCanWrite,
  statusLabel,
  temperatureLabel,
  temperatureOptions,
} from '../crm.constants'
import { useCrmList, useCrmLookups } from '../crm.hooks'
import type { EntityKind, ListFilters } from '../crm.types'

type Props = {
  entity: EntityKind
  title: string
  description: string
  createLabel: string
  createPath: string
}

const entityConfig = {
  companies: {
    sort: 'created_at',
    empty: 'Nenhuma empresa encontrada.',
    headers: ['Empresa', 'Localização', 'Contato', 'Status'],
    detail: '/empresas/',
  },
  contacts: {
    sort: 'created_at',
    empty: 'Nenhum contato encontrado.',
    headers: ['Contato', 'Empresa', 'Cargo', 'Canais'],
    detail: '/contatos/',
  },
  leads: {
    sort: 'created_at',
    empty: 'Nenhum lead encontrado.',
    headers: ['Lead', 'Empresa', 'Temperatura', 'Status', 'Próxima ação'],
    detail: '/leads/',
  },
} satisfies Record<EntityKind, { sort: string; empty: string; headers: string[]; detail: string }>

function useFilters(entity: EntityKind) {
  const [params, setParams] = useSearchParams()
  const config = entityConfig[entity]
  const filters: ListFilters = {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: PAGE_SIZE,
    search: params.get('busca') ?? '',
    status: params.get('status') ?? '',
    companyId: params.get('empresa') ?? '',
    ownerId: params.get('responsavel') ?? '',
    sourceId: params.get('origem') ?? '',
    temperature: params.get('temperatura') ?? '',
    sort: params.get('ordem') ?? config.sort,
    direction: params.get('direcao') === 'asc' ? 'asc' : 'desc',
  }
  const update = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: true },
    )
  return { filters, update }
}

function cells(
  entity: EntityKind,
  row: Record<string, unknown>,
  companyNames: Map<string, string>,
) {
  if (entity === 'companies')
    return [
      <>
        <strong className="block font-medium">{String(row.trade_name)}</strong>
        <span className="text-xs text-muted-foreground">
          {String(row.legal_name ?? row.tax_id ?? 'Sem razão social')}
        </span>
      </>,
      `${String(row.city ?? '—')}${row.state ? ` / ${String(row.state)}` : ''}`,
      <>
        <span className="block">{String(row.email ?? '—')}</span>
        <span className="text-xs text-muted-foreground">{String(row.phone ?? '')}</span>
      </>,
      statusLabel(String(row.status)),
    ]
  if (entity === 'contacts')
    return [
      <>
        <strong className="block font-medium">
          {`${String(row.first_name)} ${String(row.last_name ?? '')}`.trim()}
        </strong>
        {row.is_primary ? <span className="text-xs text-primary">Contato principal</span> : null}
      </>,
      companyNames.get(String(row.company_id)) ?? '—',
      String(row.job_title ?? row.department ?? '—'),
      <>
        <span className="block">{String(row.email ?? '—')}</span>
        <span className="text-xs text-muted-foreground">
          {String(row.phone ?? row.whatsapp ?? '')}
        </span>
      </>,
    ]
  return [
    <>
      <strong className="block font-medium">{String(row.name)}</strong>
      <span className="text-xs text-muted-foreground">Score {String(row.score)}</span>
    </>,
    companyNames.get(String(row.company_id)) ?? 'Sem empresa',
    temperatureLabel(String(row.temperature)),
    statusLabel(String(row.status)),
    <>
      <span className="block">{String(row.next_action ?? '—')}</span>
      <span className="text-xs text-muted-foreground">
        {row.next_contact_at ? new Date(String(row.next_contact_at)).toLocaleString('pt-BR') : ''}
      </span>
    </>,
  ]
}

export function CrmListPage({ createLabel, createPath, description, entity, title }: Props) {
  const { activeOrganization } = useOrganization()
  const { filters, update } = useFilters(entity)
  const query = useCrmList(entity, activeOrganization?.organizationId, filters)
  const lookups = useCrmLookups(activeOrganization?.organizationId)
  const config = entityConfig[entity]
  const rows = (query.data?.rows ?? []) as unknown as Array<Record<string, unknown>>
  const companyNames = new Map(
    (lookups.data?.companies ?? []).map((option) => [option.value, option.label]),
  )
  if (!activeOrganization)
    return <StatePanel>Crie ou selecione uma organização para começar.</StatePanel>
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          roleCanWrite(activeOrganization.role) ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              to={createPath}
            >
              <Plus className="size-4" />
              {createLabel}
            </Link>
          ) : undefined
        }
        description={description}
        title={title}
      />
      <section className="rounded-xl border border-border bg-card">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative md:col-span-2 xl:col-span-1">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              aria-label="Buscar"
              className="pl-9"
              onChange={(event) => update('busca', event.target.value)}
              placeholder="Buscar..."
              value={filters.search}
            />
          </label>
          {entity !== 'contacts' ? (
            <Select
              aria-label="Status"
              onChange={(event) => update('status', event.target.value)}
              value={filters.status}
            >
              <option value="">Todos os status</option>
              {(entity === 'companies' ? companyStatusOptions : leadStatusOptions)
                .filter((o) => o.value !== 'archived')
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </Select>
          ) : null}
          {entity !== 'companies' ? (
            <Select
              aria-label="Empresa"
              onChange={(event) => update('empresa', event.target.value)}
              value={filters.companyId}
            >
              <option value="">Todas as empresas</option>
              {lookups.data?.companies.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          ) : null}
          {entity === 'leads' ? (
            <Select
              aria-label="Temperatura"
              onChange={(event) => update('temperatura', event.target.value)}
              value={filters.temperature}
            >
              <option value="">Todas as temperaturas</option>
              {temperatureOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          ) : null}
          {entity !== 'contacts' ? (
            <Select
              aria-label="Responsável"
              onChange={(event) => update('responsavel', event.target.value)}
              value={filters.ownerId}
            >
              <option value="">Todos os responsáveis</option>
              {lookups.data?.members.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : null}
          {entity !== 'contacts' ? (
            <Select
              aria-label="Origem"
              onChange={(event) => update('origem', event.target.value)}
              value={filters.sourceId}
            >
              <option value="">Todas as origens</option>
              {lookups.data?.sources.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : null}
          <Select
            aria-label="Ordenação"
            onChange={(event) => update('ordem', event.target.value)}
            value={filters.sort}
          >
            <option value="created_at">Mais recentes</option>
            <option
              value={
                entity === 'companies'
                  ? 'trade_name'
                  : entity === 'contacts'
                    ? 'first_name'
                    : 'name'
              }
            >
              Nome
            </option>
            {entity === 'leads' ? <option value="score">Score</option> : null}
          </Select>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm"
            onClick={() => update('direcao', filters.direction === 'asc' ? 'desc' : 'asc')}
            type="button"
          >
            <ArrowUpDown className="size-4" />
            {filters.direction === 'asc' ? 'Crescente' : 'Decrescente'}
          </button>
        </div>
        {query.isLoading ? (
          <div className="p-4">
            <StatePanel kind="loading">Carregando registros...</StatePanel>
          </div>
        ) : query.error ? (
          <div className="p-4">
            <StatePanel kind="error">{query.error.message}</StatePanel>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <StatePanel>{config.empty}</StatePanel>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  {config.headers.map((header) => (
                    <th className="px-4 py-3 font-medium" key={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr className="transition-colors hover:bg-muted/50" key={String(row.id)}>
                    {cells(entity, row, companyNames).map((cell, index) => (
                      <td className="px-4 py-3" key={config.headers[index]}>
                        {index === 0 ? (
                          <Link
                            className="hover:text-primary"
                            to={`${config.detail}${String(row.id)}`}
                          >
                            {cell}
                          </Link>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          count={query.data?.count ?? 0}
          onChange={(page) => update('page', String(page))}
          page={filters.page}
          pageSize={filters.pageSize}
        />
      </section>
    </div>
  )
}
