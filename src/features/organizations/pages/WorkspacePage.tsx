import { Building2, Check, ChevronRight, LogOut, Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth'
import { getAuthErrorMessage, signOut } from '@/features/auth/auth.service'

import { useOrganization } from '../useOrganization'

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  viewer: 'Viewer',
} as const

export function WorkspacePage() {
  const { user } = useAuth()
  const { activeOrganization, error, isLoading, organizations, refetch, setActiveOrganization } =
    useOrganization()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  async function handleSignOut() {
    setSignOutError(null)

    try {
      await signOut()
    } catch (signOutFailure) {
      setSignOutError(getAuthErrorMessage(signOutFailure))
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
                C+
              </span>
              CRM+
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button onClick={() => void handleSignOut()} variant="outline">
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </Button>
        </header>

        <section className="py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Suas organizações</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Selecione o ambiente em que deseja trabalhar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeOrganization ? (
                <Link
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                  to="/empresas"
                >
                  Abrir CRM
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
                to="/organizacoes"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nova organização
              </Link>
            </div>
          </div>

          {signOutError ? (
            <p className="mt-6 text-sm text-red-600" role="alert">
              {signOutError}
            </p>
          ) : null}

          {isLoading ? (
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <Spinner />
              Carregando organizações...
            </div>
          ) : null}

          {error ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
              <p className="font-medium text-red-800 dark:text-red-200">
                Não foi possível carregar suas organizações.
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error.message}</p>
              <Button className="mt-4" onClick={() => void refetch()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!isLoading && !error && organizations.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
              <Building2 className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-4 font-medium">Nenhuma organização encontrada</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Crie sua primeira organização para configurar um ambiente comercial isolado.
              </p>
              <Link
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                to="/organizacoes"
              >
                <Plus className="size-4" aria-hidden="true" />
                Criar organização
              </Link>
            </div>
          ) : null}

          {!isLoading && !error && organizations.length > 0 ? (
            <div className="mt-8 grid gap-3">
              {organizations.map((organization) => {
                const isActive = activeOrganization?.organizationId === organization.organizationId

                return (
                  <button
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted"
                    key={organization.organizationId}
                    onClick={() => setActiveOrganization(organization.organizationId)}
                    type="button"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{organization.name}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        {roleLabels[organization.role]}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <Check className="size-4" aria-hidden="true" />
                        Ativa
                      </span>
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </button>
                )
              })}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
