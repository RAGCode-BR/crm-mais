import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'

import { scoringCanManage } from '../scoring.constants'
import { useSaveScoringRule, useScoringRule } from '../scoring.hooks'
import type { ScoringRuleInput } from '../scoring.types'
import { ScoringRuleForm } from './ScoringRuleForm'

const defaults: ScoringRuleInput = {
  name: '',
  description: '',
  ruleType: 'lead_status',
  conditionValue: 'qualified',
  points: 10,
  isActive: true,
}

export function ScoringRuleEditor({ ruleId }: { ruleId?: string }) {
  const navigate = useNavigate()
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const query = useScoringRule(organizationId, ruleId)
  const mutation = useSaveScoringRule(organizationId, ruleId)
  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!scoringCanManage(activeOrganization.role))
    return <StatePanel kind="error">Somente gestores podem configurar regras de score.</StatePanel>
  if (ruleId && query.isLoading) return <StatePanel kind="loading">Carregando regra...</StatePanel>
  if (query.error) return <StatePanel kind="error">{query.error.message}</StatePanel>
  const values: ScoringRuleInput = query.data
    ? {
        name: query.data.name,
        description: query.data.description ?? '',
        ruleType: query.data.rule_type,
        conditionValue: query.data.condition_value,
        points: query.data.points,
        isActive: query.data.is_active,
      }
    : defaults
  return (
    <div className="space-y-6">
      <PageHeader
        description="Defina condições e pesos sem alterar o código do sistema."
        title={ruleId ? 'Editar regra de score' : 'Nova regra de score'}
      />
      <ScoringRuleForm
        defaultValues={values}
        isSaving={mutation.isPending}
        onSave={async (input) => {
          await mutation.mutateAsync(input)
          navigate('/inteligencia/scoring/regras')
        }}
      />
      {mutation.error ? <StatePanel kind="error">{mutation.error.message}</StatePanel> : null}
    </div>
  )
}
