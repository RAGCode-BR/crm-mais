import {
  Building2,
  ContactRound,
  GitBranch,
  History,
  ListTodo,
  LogOut,
  Menu,
  Settings2,
  Target,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth'
import { signOut } from '@/features/auth/auth.service'
import { useOrganization } from '@/features/organizations/useOrganization'
import { cn } from '@/lib/utils/cn'

const navigation = [
  { to: '/empresas', label: 'Empresas', icon: Building2 },
  { to: '/contatos', label: 'Contatos', icon: ContactRound },
  { to: '/leads', label: 'Leads', icon: Target },
  { to: '/oportunidades', label: 'Oportunidades', icon: GitBranch },
  { to: '/timeline', label: 'Timeline', icon: History },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo },
]

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { activeOrganization, organizations, setActiveOrganization } = useOrganization()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <NavLink className="flex items-center gap-2 font-semibold" to="/empresas">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs text-primary-foreground">
              C+
            </span>
            CRM+
          </NavLink>
          <Button className="size-9 px-0 lg:hidden" onClick={() => setOpen(false)} variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
        <div className="border-b border-border p-4">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="organization-switcher"
          >
            Organização
          </label>
          <select
            className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            id="organization-switcher"
            onChange={(event) => setActiveOrganization(event.target.value)}
            value={activeOrganization?.organizationId ?? ''}
          >
            {organizations.map((organization) => (
              <option key={organization.organizationId} value={organization.organizationId}>
                {organization.name}
              </option>
            ))}
          </select>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
              key={to}
              onClick={() => setOpen(false)}
              to={to}
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <NavLink
            className="mb-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            to="/"
          >
            <Settings2 className="size-4" />
            Gerenciar organizações
          </NavLink>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <Button className="mt-3 w-full" onClick={() => void signOut()} variant="outline">
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </aside>
      {open ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <Button className="size-10 px-0" onClick={() => setOpen(true)} variant="outline">
            <Menu className="size-5" />
          </Button>
          <span className="ml-3 truncate text-sm font-medium">
            {activeOrganization?.name ?? 'CRM+'}
          </span>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
