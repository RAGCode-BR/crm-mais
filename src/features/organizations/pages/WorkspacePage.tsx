import {
  Building2,
  Check,
  ChevronRight,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth'
import { getAuthErrorMessage, signOut } from '@/features/auth/auth.service'
import { cn } from '@/lib/utils/cn'

import {
  deleteOrganization,
  getOrganizationErrorMessage,
  renameOrganization,
  type OrganizationAccess,
} from '../organization.service'
import { organizationNameSchema } from '../organization.schemas'
import { useOrganization } from '../useOrganization'
import { organizationKeys } from '../useOrganizations'

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  viewer: 'Viewer',
} as const

export function WorkspacePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { activeOrganization, error, isLoading, organizations, refetch, setActiveOrganization } =
    useOrganization()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [organizationError, setOrganizationError] = useState<string | null>(null)
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState<OrganizationAccess | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSignOut() {
    setSignOutError(null)

    try {
      await signOut()
    } catch (signOutFailure) {
      setSignOutError(getAuthErrorMessage(signOutFailure))
    }
  }

  function startRename(organization: OrganizationAccess) {
    setOrganizationError(null)
    setEditingOrganizationId(organization.organizationId)
    setEditingName(organization.name)
  }

  async function handleRename(organizationId: string) {
    const parsed = organizationNameSchema.safeParse(editingName)
    if (!parsed.success) {
      setOrganizationError(parsed.error.issues[0]?.message ?? 'Informe um nome válido.')
      return
    }
    if (!user) return

    setOrganizationError(null)
    setIsSaving(true)
    try {
      await renameOrganization(organizationId, parsed.data)
      await queryClient.invalidateQueries({ queryKey: organizationKeys.forUser(user.id) })
      setEditingOrganizationId(null)
    } catch (renameError) {
      setOrganizationError(getOrganizationErrorMessage(renameError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteCandidate || !user) return

    setOrganizationError(null)
    setIsDeleting(true)
    try {
      await deleteOrganization(deleteCandidate.organizationId)
      await queryClient.invalidateQueries({ queryKey: organizationKeys.forUser(user.id) })
      setDeleteCandidate(null)
    } catch (deleteError) {
      setOrganizationError(getOrganizationErrorMessage(deleteError))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.11),_transparent_34rem)] px-5 py-6 text-foreground sm:px-10 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card/90 px-5 py-4 shadow-sm shadow-slate-950/[0.03] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo className="w-20 shrink-0 sm:w-24" />
            <div className="min-w-0 border-l border-border pl-4">
              <p className="text-sm font-semibold">Organizações</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            className="self-start sm:self-auto"
            onClick={() => void handleSignOut()}
            variant="outline"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </Button>
        </header>

        <section className="py-10 sm:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Espaços de trabalho
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Suas organizações
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Selecione, gerencie ou crie um ambiente para sua operação comercial.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeOrganization ? (
                <Link
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-opacity hover:opacity-90"
                  to="/dashboard"
                >
                  Abrir CRM
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
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

          {organizationError ? (
            <p className="mt-6 text-sm text-red-600" role="alert">
              {organizationError}
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
            <div className="mt-8 grid gap-4">
              {organizations.map((organization) => {
                const isActive = activeOrganization?.organizationId === organization.organizationId
                const canRename = organization.role === 'owner' || organization.role === 'admin'
                const canDelete = organization.role === 'owner'
                const isEditing = editingOrganizationId === organization.organizationId

                return (
                  <article
                    className={cn(
                      'group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm shadow-slate-950/[0.025] transition-all sm:p-5',
                      isActive
                        ? 'border-primary/25 bg-blue-50/40 ring-1 ring-primary/10 dark:bg-primary/10'
                        : 'border-border hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md hover:shadow-slate-950/[0.05]',
                    )}
                    key={organization.organizationId}
                  >
                    <span
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-xl',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Building2 className="size-5" aria-hidden="true" />
                    </span>
                    {isEditing ? (
                      <form
                        className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center"
                        onSubmit={(event) => {
                          event.preventDefault()
                          void handleRename(organization.organizationId)
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <label
                            className="sr-only"
                            htmlFor={`organization-name-${organization.organizationId}`}
                          >
                            Nome da organização
                          </label>
                          <Input
                            autoFocus
                            disabled={isSaving}
                            id={`organization-name-${organization.organizationId}`}
                            maxLength={120}
                            onChange={(event) => setEditingName(event.target.value)}
                            value={editingName}
                          />
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ShieldCheck className="size-3.5" aria-hidden="true" />
                            {roleLabels[organization.role]}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button disabled={isSaving} type="submit">
                            {isSaving ? 'Salvando...' : 'Salvar'}
                          </Button>
                          <Button
                            disabled={isSaving}
                            onClick={() => setEditingOrganizationId(null)}
                            type="button"
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <button
                          className="flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setActiveOrganization(organization.organizationId)}
                          type="button"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-semibold">
                              {organization.name}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <ShieldCheck className="size-3.5" aria-hidden="true" />
                              {roleLabels[organization.role]}
                            </span>
                          </span>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <Check className="size-4" aria-hidden="true" />
                              Ativa
                            </span>
                          ) : (
                            <ChevronRight
                              className="size-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                        {canRename || canDelete ? (
                          <div className="flex shrink-0 items-center gap-1 border-l border-border pl-3">
                            {canRename ? (
                              <Button
                                aria-label={`Renomear ${organization.name}`}
                                className="size-9 rounded-lg px-0 text-muted-foreground hover:text-foreground"
                                onClick={() => startRename(organization)}
                                variant="ghost"
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Button>
                            ) : null}
                            {canDelete ? (
                              <Button
                                aria-label={`Excluir ${organization.name}`}
                                className="size-9 rounded-lg px-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setDeleteCandidate(organization)}
                                variant="ghost"
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          ) : null}
        </section>
      </div>
      <ConfirmDialog
        confirmLabel="Excluir organização"
        description={
          deleteCandidate
            ? `A organização “${deleteCandidate.name}” e todos os seus dados serão excluídos permanentemente.`
            : ''
        }
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => void handleDelete()}
        open={Boolean(deleteCandidate)}
        pending={isDeleting}
        title="Excluir organização?"
      />
    </main>
  )
}
