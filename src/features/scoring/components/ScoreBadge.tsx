import { cn } from '@/lib/utils/cn'
import type { LeadScoreClassification } from '@/types/database/scoring'

import { classificationLabel } from '../scoring.constants'

export function ScoreBadge({
  classification,
  score,
}: {
  classification: LeadScoreClassification
  score: number
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        classification === 'very_hot' && 'bg-red-100 text-red-800',
        classification === 'hot' && 'bg-orange-100 text-orange-800',
        classification === 'warm' && 'bg-amber-100 text-amber-800',
        classification === 'cold' && 'bg-slate-100 text-slate-700',
      )}
    >
      <strong>{score}</strong> · {classificationLabel[classification]}
    </span>
  )
}
