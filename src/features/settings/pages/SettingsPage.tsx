import {
  BellRing,
  Building2,
  GitBranch,
  ListChecks,
  Palette,
  ShieldCheck,
  Tags,
  Users,
  UserRound,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { useOrganization } from '@/features/organizations/useOrganization'

const organizationItems = [
  ['/configuracoes/organizacao', 'Organização', 'Nome e identificador da organização.', Building2],
  ['/configuracoes/usuarios', 'Usuários', 'Convites, perfis, equipes e situação de acesso.', Users],
  ['/configuracoes/equipes', 'Equipes', 'Estrutura dos grupos comerciais.', Workflow],
  ['/configuracoes/permissoes', 'Permissões', 'Matriz de capacidades por perfil.', ShieldCheck],
  ['/pipelines', 'Pipelines e etapas', 'Fluxos e etapas do processo comercial.', GitBranch],
  ['/configuracoes/origens', 'Origens', 'Canais de aquisição de leads.', Zap],
  ['/configuracoes/tags', 'Tags', 'Marcadores e cores para organização.', Tags],
  [
    '/configuracoes/motivos-de-perda',
    'Motivos de perda',
    'Motivos padronizados para análise.',
    XCircle,
  ],
  [
    '/inteligencia/scoring/regras',
    'Regras de score',
    'Critérios automáticos de qualificação.',
    ListChecks,
  ],
  ['/auditoria', 'Auditoria', 'Histórico de alterações administrativas.', Palette],
] as const

const personalItems = [
  ['/configuracoes/pessoais', 'Meu perfil', 'Nome, telefone, idioma e fuso horário.', UserRound],
  ['/notificacoes/preferencias', 'Notificações', 'Preferências pessoais de alertas.', BellRing],
] as const

function CardGrid({ items }: { items: typeof organizationItems | typeof personalItems }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(([to, title, description, Icon]) => (
        <Link
          className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-sm"
          key={to}
          to={to}
        >
          <Icon className="mb-4 size-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </Link>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const { activeOrganization } = useOrganization()
  return (
    <div className="space-y-8">
      <PageHeader
        description={`Administre ${activeOrganization?.name ?? 'seu ambiente'} e suas preferências.`}
        title="Configurações"
      />
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Configurações da organização</h2>
          <p className="text-sm text-muted-foreground">
            Dados e regras compartilhados com toda a equipe.
          </p>
        </div>
        <CardGrid items={organizationItems} />
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Configurações pessoais</h2>
          <p className="text-sm text-muted-foreground">
            Preferências aplicadas apenas à sua conta.
          </p>
        </div>
        <CardGrid items={personalItems} />
      </section>
    </div>
  )
}
