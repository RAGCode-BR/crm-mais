import { Building2, CalendarDays, GripVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Select } from '@/components/ui/Select'
import { opportunityStatusLabel } from '../pipeline.constants'
import type { Opportunity, PipelineStage } from '@/types/database/pipeline'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function OpportunityCard({
  canMove,
  companyName,
  onMove,
  opportunity,
  stages,
}: {
  canMove: boolean
  companyName: string
  onMove: (stageId: string) => void
  opportunity: Opportunity
  stages: PipelineStage[]
}) {
  return (
    <article
      className="group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
      draggable={canMove}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/opportunity-id', opportunity.id)
      }}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-50" />
        <div className="min-w-0 flex-1">
          <Link
            className="font-medium leading-5 hover:text-primary"
            to={`/oportunidades/${opportunity.id}`}
          >
            {opportunity.title}
          </Link>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Building2 className="size-3" />
            {companyName}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <strong className="block text-sm">
            {currency.format(Number(opportunity.estimated_value))}
          </strong>
          <span className="text-xs text-muted-foreground">
            {opportunity.probability}% · {opportunityStatusLabel(opportunity.status)}
          </span>
        </div>
        {opportunity.expected_close_date ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3" />
            {new Date(`${opportunity.expected_close_date}T12:00:00`).toLocaleDateString('pt-BR')}
          </span>
        ) : null}
      </div>
      {canMove ? (
        <Select
          aria-label={`Mover ${opportunity.title}`}
          className="mt-3 h-8 text-xs"
          onChange={(event) => onMove(event.target.value)}
          value={opportunity.stage_id}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </Select>
      ) : null}
    </article>
  )
}
