import { ArrowLeft, Pencil, Plus, Scale, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useOrganization } from '@/features/organizations/useOrganization'

import { scoringCanManage, scoringRuleTypes } from '../scoring.constants'
import { useDeleteScoringRule, useScoringRules } from '../scoring.hooks'
import type { LeadScoringRule } from '@/types/database/scoring'

export function ScoringRulesPage() {
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const query = useScoringRules(activeOrganization?.organizationId)
  const removeRule = useDeleteScoringRule(organizationId)
  const canManage = scoringCanManage(activeOrganization?.role)
  const [deletingRule, setDeletingRule] = useState<LeadScoringRule | null>(null)
  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        to="/inteligencia/scoring"
      >
        <ArrowLeft className="size-4" /> Voltar para lead scoring
      </Link>
      <PageHeader
        actions={
          canManage ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              to="/inteligencia/scoring/regras/nova"
            >
              <Plus className="size-4" /> Nova regra
            </Link>
          ) : undefined
        }
        description="Configure condições e pesos usados pelo cálculo de prioridade."
        title="Regras de lead scoring"
      />
      {query.isLoading ? (
        <StatePanel kind="loading">Carregando regras...</StatePanel>
      ) : query.error ? (
        <StatePanel kind="error">{query.error.message}</StatePanel>
      ) : query.data?.length ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Regra</th>
                  <th className="px-4 py-3">Condição</th>
                  <th className="px-4 py-3">Pontos</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.data.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.description ?? 'Sem descrição'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {scoringRuleTypes.find(({ value }) => value === rule.rule_type)?.label}
                      <p className="text-xs text-muted-foreground">Valor: {rule.condition_value}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={rule.points > 0 ? 'text-emerald-700' : 'text-red-700'}>
                        {rule.points > 0 ? '+' : ''}
                        {rule.points}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={rule.is_active ? 'success' : 'neutral'}>
                        {rule.is_active ? 'Ativa' : 'Inativa'}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canManage ? (
                          <>
                            <Link
                              aria-label={`Editar ${rule.name}`}
                              className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
                              to={`/inteligencia/scoring/regras/${rule.id}/editar`}
                            >
                              <Pencil className="size-4" />
                            </Link>
                            <Button
                              aria-label={`Excluir ${rule.name}`}
                              className="size-9 px-0 text-red-600"
                              disabled={removeRule.isPending}
                              onClick={() => setDeletingRule(rule)}
                              variant="ghost"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <StatePanel>
          <Scale className="mx-auto mb-3 size-7 text-muted-foreground" />
          Nenhuma regra de score configurada.
        </StatePanel>
      )}
      {removeRule.error ? <StatePanel kind="error">{removeRule.error.message}</StatePanel> : null}
      <ConfirmDialog
        confirmLabel="Excluir regra"
        description={`A regra “${deletingRule?.name ?? ''}” deixará de participar do cálculo de score.`}
        onCancel={() => setDeletingRule(null)}
        onConfirm={() => {
          if (deletingRule)
            removeRule.mutate(deletingRule.id, { onSuccess: () => setDeletingRule(null) })
        }}
        open={Boolean(deletingRule)}
        pending={removeRule.isPending}
        title="Excluir esta regra?"
      />
    </div>
  )
}
