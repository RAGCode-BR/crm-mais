import { Navigate, useParams } from 'react-router-dom'

import { ScoringRuleEditor } from '../components/ScoringRuleEditor'

export function EditScoringRulePage() {
  const { ruleId } = useParams()
  return ruleId ? (
    <ScoringRuleEditor ruleId={ruleId} />
  ) : (
    <Navigate replace to="/inteligencia/scoring/regras" />
  )
}
