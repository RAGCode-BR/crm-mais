import {
  ArrowRightLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare2,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  StickyNote,
  UserRoundCog,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Activity } from '@/types/database/engagement'
import { activityTypeLabel } from '../timeline.constants'

const icons: Record<string, LucideIcon> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: CalendarDays,
  note: StickyNote,
  stage_change: Workflow,
  assignment_change: UserRoundCog,
  proposal: FileText,
  task: CheckSquare2,
  system: BriefcaseBusiness,
}

type LookupMaps = {
  companies: Map<string, string>
  contacts: Map<string, string>
  leads: Map<string, string>
  opportunities: Map<string, string>
  members: Map<string, string>
}

export function TimelineItem({ activity, maps }: { activity: Activity; maps: LookupMaps }) {
  const Icon = icons[activity.type] ?? ArrowRightLeft
  const links = [
    activity.company_id && {
      to: `/empresas/${activity.company_id}`,
      label: maps.companies.get(activity.company_id) ?? 'Empresa',
    },
    activity.contact_id && {
      to: `/contatos/${activity.contact_id}`,
      label: maps.contacts.get(activity.contact_id) ?? 'Contato',
    },
    activity.lead_id && {
      to: `/leads/${activity.lead_id}`,
      label: maps.leads.get(activity.lead_id) ?? 'Lead',
    },
    activity.opportunity_id && {
      to: `/oportunidades/${activity.opportunity_id}`,
      label: maps.opportunities.get(activity.opportunity_id) ?? 'Oportunidade',
    },
  ].filter(Boolean) as Array<{ to: string; label: string }>
  return (
    <li className="relative grid grid-cols-[42px_1fr] gap-3 pb-7 last:pb-0">
      <div className="relative z-10 grid size-10 place-items-center rounded-full border border-border bg-card text-primary">
        <Icon className="size-4" />
      </div>
      <article className="min-w-0 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium">{activity.subject}</h2>
              <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                {activityTypeLabel(activity.type)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(activity.occurred_at).toLocaleString('pt-BR')}
              {activity.actor_member_id
                ? ` · por ${maps.members.get(activity.actor_member_id) ?? 'Usuário'}`
                : ' · evento automático'}
            </p>
          </div>
        </div>
        {activity.description ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {activity.description}
          </p>
        ) : null}
        {links.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                key={`${link.to}-${link.label}`}
                to={link.to}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </article>
    </li>
  )
}
