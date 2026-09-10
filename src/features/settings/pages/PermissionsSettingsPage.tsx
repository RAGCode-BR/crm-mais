import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { SettingsBackLink } from '../components/SettingsBackLink'

const permissions = [
  [
    'Proprietário',
    'Controle total, incluindo proprietários e exclusão da organização.',
    'Sim',
    'Sim',
    'Sim',
  ],
  [
    'Administrador',
    'Administra usuários e configurações, sem alterar proprietários.',
    'Sim',
    'Sim',
    'Sim',
  ],
  ['Gestor', 'Gerencia configurações comerciais e todos os registros.', 'Não', 'Sim', 'Sim'],
  [
    'Vendedor',
    'Cria e edita registros comerciais, sem acesso administrativo.',
    'Não',
    'Não',
    'Sim',
  ],
  ['Leitor', 'Consulta dados da organização sem realizar alterações.', 'Não', 'Não', 'Não'],
]

export function PermissionsSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={<SettingsBackLink />}
        description="As permissões são aplicadas por perfil e protegidas também no banco de dados."
        title="Permissões"
      />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="p-4">Perfil</th>
              <th className="p-4">Escopo</th>
              <th className="p-4">Usuários</th>
              <th className="p-4">Configurações</th>
              <th className="p-4">Editar CRM</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(([role, scope, users, settings, crm]) => (
              <tr className="border-b border-border last:border-0" key={role}>
                <td className="p-4 font-medium">{role}</td>
                <td className="p-4 text-muted-foreground">{scope}</td>
                <td className="p-4">{users}</td>
                <td className="p-4">{settings}</td>
                <td className="p-4">{crm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">
        Para atribuir um perfil, acesse{' '}
        <Link className="font-medium text-primary hover:underline" to="/configuracoes/usuarios">
          Usuários
        </Link>
        .
      </p>
    </div>
  )
}
