import { MailPlus, Save } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrganization } from '@/features/organizations/useOrganization'
import type { MembershipStatus, OrganizationRole } from '@/types/database/identity'

import { SettingsBackLink } from '../components/SettingsBackLink'
import { useCatalog, useMemberMutations, useMembers } from '../settings.hooks'
import type { MemberView } from '../settings.types'

const roleLabels: Record<OrganizationRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gestor',
  sales: 'Vendedor',
  viewer: 'Leitor',
}
const statusLabels: Record<MembershipStatus, string> = {
  invited: 'Convidado',
  active: 'Ativo',
  suspended: 'Suspenso',
}

function MemberRow({
  canAdmin,
  member,
  onSave,
  pending,
  teams,
}: {
  canAdmin: boolean
  member: MemberView
  onSave: (
    id: string,
    input: { role: OrganizationRole; status: MembershipStatus; teamId: string },
  ) => void
  pending: boolean
  teams: Array<{ id: string; name: string }>
}) {
  const [role, setRole] = useState(member.role)
  const [status, setStatus] = useState(member.status)
  const [teamId, setTeamId] = useState(member.team_id ?? '')
  return (
    <div className="grid gap-3 border-b border-border p-4 last:border-b-0 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={member.profile.full_name} />
        <div className="min-w-0">
          <p className="truncate font-medium">{member.profile.full_name}</p>
          <p className="text-sm text-muted-foreground">{member.profile.phone ?? 'Sem telefone'}</p>
        </div>
      </div>
      <Select
        aria-label={`Perfil de ${member.profile.full_name}`}
        disabled={!canAdmin || (member.role === 'owner' && role === 'owner')}
        onChange={(event) => setRole(event.target.value as OrganizationRole)}
        value={role}
      >
        {Object.entries(roleLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        aria-label={`Equipe de ${member.profile.full_name}`}
        disabled={!canAdmin}
        onChange={(event) => setTeamId(event.target.value)}
        value={teamId}
      >
        <option value="">Sem equipe</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label={`Status de ${member.profile.full_name}`}
        disabled={!canAdmin}
        onChange={(event) => setStatus(event.target.value as MembershipStatus)}
        value={status}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      {canAdmin ? (
        <Button
          aria-label={`Salvar ${member.profile.full_name}`}
          className="size-10 px-0"
          disabled={pending}
          onClick={() => onSave(member.id, { role, status, teamId })}
        >
          <Save className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}

export function MembersSettingsPage() {
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const canAdmin = activeOrganization?.role === 'owner' || activeOrganization?.role === 'admin'
  const members = useMembers(organizationId)
  const teams = useCatalog('teams', organizationId)
  const mutations = useMemberMutations(organizationId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrganizationRole>('sales')
  const [teamId, setTeamId] = useState('')
  const teamOptions = (teams.data ?? []).map((team) => ({ id: team.id, name: team.name }))
  return (
    <div className="space-y-6">
      <PageHeader
        actions={<SettingsBackLink />}
        description="Convide pessoas e controle seu acesso à organização."
        title="Usuários"
      />
      {canAdmin ? (
        <form
          className="grid gap-3 rounded-xl border border-border bg-card p-5 md:grid-cols-[1.5fr_1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            void mutations.invite.mutateAsync({ email, role, teamId }).then(() => setEmail(''))
          }}
        >
          <Input
            aria-label="E-mail da pessoa convidada"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@empresa.com"
            required
            type="email"
            value={email}
          />
          <Select
            aria-label="Perfil da pessoa convidada"
            onChange={(event) => setRole(event.target.value as OrganizationRole)}
            value={role}
          >
            {Object.entries(roleLabels)
              .filter(([value]) => activeOrganization.role === 'owner' || value !== 'owner')
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </Select>
          <Select
            aria-label="Equipe da pessoa convidada"
            onChange={(event) => setTeamId(event.target.value)}
            value={teamId}
          >
            <option value="">Sem equipe</option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
          <Button disabled={mutations.invite.isPending} type="submit">
            <MailPlus className="size-4" /> Convidar
          </Button>
        </form>
      ) : (
        <StatePanel>Somente proprietários e administradores podem gerenciar usuários.</StatePanel>
      )}
      {members.isLoading || teams.isLoading ? (
        <StatePanel kind="loading">Carregando usuários...</StatePanel>
      ) : members.error || teams.error ? (
        <StatePanel kind="error">{members.error?.message ?? teams.error?.message}</StatePanel>
      ) : (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          {members.data?.map((member) => (
            <MemberRow
              canAdmin={canAdmin}
              key={member.id}
              member={member}
              onSave={(id, input) => mutations.update.mutate({ id, input })}
              pending={mutations.update.isPending}
              teams={teamOptions}
            />
          ))}
        </section>
      )}
      {mutations.invite.error || mutations.update.error ? (
        <StatePanel kind="error">
          {(mutations.invite.error ?? mutations.update.error)?.message}
        </StatePanel>
      ) : null}
    </div>
  )
}
