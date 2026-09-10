import { ArrowRight, Bot, UserRound } from 'lucide-react'
import type { Json } from '@/types/database/common'
import { auditActionLabels, auditEntityLabels, auditFieldLabels } from '../audit.constants'
import type { AuditAction, AuditLogItem } from '../audit.types'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function asObject(value: Json | null) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function display(key: string, value: Json | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (typeof value === 'object') return JSON.stringify(value)
  if (key === 'estimated_value' && typeof value === 'number') return currency.format(value)
  if (key === 'probability' && typeof value === 'number') return `${value}%`
  if ((key.endsWith('_at') || key.endsWith('_date')) && typeof value === 'string') {
    const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
    if (!Number.isNaN(date.getTime())) return date.toLocaleString('pt-BR')
  }
  return String(value)
}

export function AuditLogCard({ log }: { log: AuditLogItem }) {
  const previous = asObject(log.previous_values)
  const current = asObject(log.new_values)
  const keys = [...new Set([...Object.keys(previous), ...Object.keys(current)])].sort()
  const action = auditActionLabels[log.action as AuditAction] ?? log.action
  return (
    <article className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">{auditEntityLabels[log.entity_type] ?? log.entity_type}</h2>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{action}</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            {log.actor_member_id ? <UserRound className="size-4" /> : <Bot className="size-4" />}
            {log.actorName}
          </p>
        </div>
        <time className="text-xs text-muted-foreground">
          {new Date(log.created_at).toLocaleString('pt-BR')}
        </time>
      </div>
      {keys.length ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Ver {keys.length} campo{keys.length === 1 ? '' : 's'} registrado
            {keys.length === 1 ? '' : 's'}
          </summary>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Campo</th>
                  <th className="px-3 py-2">Anterior</th>
                  <th className="px-3 py-2">Posterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((key) => (
                  <tr key={key}>
                    <th className="px-3 py-2 font-medium">{auditFieldLabels[key] ?? key}</th>
                    <td className="max-w-64 break-words px-3 py-2 text-muted-foreground">
                      {display(key, previous[key])}
                    </td>
                    <td className="max-w-64 break-words px-3 py-2">
                      <span className="inline-flex items-center gap-2">
                        <ArrowRight className="size-3 text-muted-foreground" />
                        {display(key, current[key])}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Operação registrada sem valores de conteúdo.
        </p>
      )}
    </article>
  )
}
