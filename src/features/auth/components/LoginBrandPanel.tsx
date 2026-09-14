import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Flame,
  Search,
  Target,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils/cn'

type MetricProps = {
  label: string
  value: string
  trend: string
}

function Metric({ label, trend, value }: MetricProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm shadow-blue-950/5">
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <strong className="text-sm tracking-tight text-slate-900">{value}</strong>
        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
          {trend}
        </span>
      </div>
    </div>
  )
}

type PipelineCardProps = {
  company: string
  name: string
  tone?: 'blue' | 'green' | 'slate'
}

function PipelineCard({ company, name, tone = 'slate' }: PipelineCardProps) {
  const dotClasses = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    slate: 'bg-slate-300',
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm shadow-slate-950/[0.03]">
      <div className="flex items-center gap-1.5">
        <span className={cn('size-1.5 rounded-full', dotClasses[tone])} />
        <p className="truncate text-[9px] font-semibold text-slate-700">{name}</p>
      </div>
      <p className="mt-1 truncate text-[8px] text-slate-400">{company}</p>
    </div>
  )
}

function FloatingCard({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <div
      className={cn(
        'absolute z-10 rounded-xl border border-white/90 bg-white/95 p-3 shadow-lg shadow-blue-950/10 backdrop-blur',
        className,
      )}
    >
      {children}
    </div>
  )
}

const benefits = [
  { icon: Users, text: 'Organize seu processo' },
  { icon: ChartNoAxesCombined, text: 'Aumente a produtividade' },
  { icon: Target, text: 'Conquiste mais resultados' },
]

export function LoginBrandPanel() {
  return (
    <aside
      aria-label="Conheça o CRM+"
      className="relative hidden min-h-screen overflow-hidden bg-[#f4f8ff] px-10 py-12 lg:flex xl:px-16"
    >
      <div className="absolute -right-36 -top-36 size-[34rem] rounded-full bg-blue-200/25 blur-3xl" />
      <div className="absolute -bottom-52 -left-44 size-[32rem] rounded-full bg-cyan-200/25 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[36rem] flex-col justify-center">
        <div className="mx-auto max-w-md text-center">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
            CRM+ para equipes comerciais
          </p>
          <h2 className="text-4xl font-semibold tracking-[-0.05em] text-slate-950 xl:text-[2.7rem] xl:leading-[1.03]">
            Transforme oportunidades em <span className="text-blue-600">vendas.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-xs leading-5 text-slate-500 xl:text-sm">
            Centralize seus leads, acompanhe negociações e mantenha sua equipe focada nas próximas
            melhores ações.
          </p>
        </div>

        <div aria-hidden="true" className="relative mx-auto mt-7 w-full max-w-[31rem] xl:mt-8">
          <FloatingCard className="-left-7 top-20 hidden w-40 xl:block">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="size-4 fill-orange-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">Lead quente</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">Ana Martins</p>
            <p className="text-xs text-slate-500">Therapeutica</p>
          </FloatingCard>

          <FloatingCard className="-right-8 bottom-5 hidden w-44 xl:block">
            <div className="flex items-center gap-2 text-emerald-600">
              <CircleDollarSign className="size-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                Nova oportunidade
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">R$ 24.500</p>
            <p className="text-xs text-slate-500">Sistema de Gestão</p>
          </FloatingCard>

          <FloatingCard className="-right-6 -top-5 hidden w-40 xl:block">
            <div className="flex items-center gap-2 text-blue-600">
              <CalendarDays className="size-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                Próxima atividade
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-800">Reunião com cliente</p>
            <p className="text-[10px] text-slate-500">Hoje · 14:30</p>
          </FloatingCard>

          <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_24px_60px_-25px_rgba(30,64,175,0.32)]">
            <div className="flex h-8 items-center border-b border-slate-100 px-3">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-slate-200" />
                <span className="size-1.5 rounded-full bg-slate-200" />
                <span className="size-1.5 rounded-full bg-slate-200" />
              </div>
              <div className="mx-auto flex h-4 w-40 items-center rounded bg-slate-50 px-2 text-[8px] text-slate-400">
                <Search className="mr-1 size-2.5" /> Buscar no CRM
              </div>
            </div>
            <div className="flex bg-slate-50/70">
              <div className="hidden w-14 border-r border-slate-100 bg-[#f9fbff] p-2 sm:block">
                <div className="grid size-5 place-items-center rounded-md bg-blue-600 text-[8px] font-bold text-white">
                  C+
                </div>
                <div className="mt-5 space-y-3">
                  {[0, 1, 2, 3].map((item) => (
                    <span className="mx-auto block size-3 rounded bg-slate-200" key={item} />
                  ))}
                </div>
              </div>
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-slate-400">Visão geral</p>
                    <p className="text-sm font-semibold tracking-tight text-slate-800">
                      Dashboard comercial
                    </p>
                  </div>
                  <div className="grid size-6 place-items-center rounded-full bg-blue-100 text-[9px] font-semibold text-blue-700">
                    AM
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Metric label="Leads" trend="+12%" value="248" />
                  <Metric label="Oportunidades" trend="+8%" value="76" />
                  <Metric label="Vendas" trend="+15%" value="R$ 284,5k" />
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-slate-700">Pipeline</p>
                    <span className="text-[9px] font-medium text-blue-600">Ver funil</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5 rounded-lg bg-blue-50/70 p-1.5">
                      <p className="text-[8px] font-semibold text-blue-700">Qualificação</p>
                      <PipelineCard company="Inova Tech" name="Marcos Silva" tone="blue" />
                    </div>
                    <div className="space-y-1.5 rounded-lg bg-violet-50/70 p-1.5">
                      <p className="text-[8px] font-semibold text-violet-700">Proposta</p>
                      <PipelineCard company="Orbital" name="Clara Melo" />
                    </div>
                    <div className="space-y-1.5 rounded-lg bg-emerald-50/70 p-1.5">
                      <p className="text-[8px] font-semibold text-emerald-700">Negociação</p>
                      <PipelineCard company="Nexo Saúde" name="Rafael Lima" tone="green" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 right-9 hidden items-center gap-1.5 text-[10px] font-semibold text-emerald-700 xl:flex">
            <ArrowUpRight className="size-4" /> Mais vendas
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-blue-100/80 pt-5 xl:mt-9">
          {benefits.map(({ icon: Icon, text }) => (
            <div className="flex items-center justify-center gap-2" key={text}>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm shadow-blue-950/5">
                <Icon className="size-4" />
              </span>
              <p className="max-w-20 text-[11px] font-medium leading-3.5 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
