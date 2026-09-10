import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { roleCanManage } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'

import { useCatalog, useCatalogMutations } from '../settings.hooks'
import type { CatalogKind, CatalogRow } from '../settings.types'
import { SettingsBackLink } from './SettingsBackLink'

function descriptionOf(row: CatalogRow) {
  return 'description' in row ? row.description : null
}

function colorOf(row: CatalogRow) {
  return 'color' in row ? row.color : null
}

function activeOf(row: CatalogRow) {
  return 'is_active' in row ? row.is_active : true
}

export function CatalogSettings({
  description,
  kind,
  title,
}: {
  description: string
  kind: CatalogKind
  title: string
}) {
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const canManage = roleCanManage(activeOrganization?.role ?? 'viewer')
  const query = useCatalog(kind, organizationId)
  const mutations = useCatalogMutations(kind, organizationId)
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [color, setColor] = useState('#2563EB')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingRow, setDeletingRow] = useState<CatalogRow | null>(null)

  const reset = () => {
    setName('')
    setDetails('')
    setColor('#2563EB')
    setEditingId(null)
  }
  const editing = query.data?.find((row) => row.id === editingId)
  const pending =
    mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending
  const error = mutations.create.error ?? mutations.update.error ?? mutations.remove.error

  return (
    <div className="space-y-6">
      <PageHeader actions={<SettingsBackLink />} description={description} title={title} />
      {!canManage ? (
        <StatePanel>
          Você pode consultar esta configuração, mas somente gestores podem alterá-la.
        </StatePanel>
      ) : (
        <form
          className="grid gap-3 rounded-xl border border-border bg-card p-5 md:grid-cols-[1fr_1.5fr_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) return
            const input = {
              name,
              description: details,
              color,
              isActive: editing ? activeOf(editing) : true,
            }
            const promise = editingId
              ? mutations.update.mutateAsync({ id: editingId, ...input })
              : mutations.create.mutateAsync(input)
            void promise.then(reset)
          }}
        >
          <Input
            aria-label="Nome"
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome"
            required
            value={name}
          />
          {kind === 'tags' ? (
            <Input
              aria-label="Cor"
              onChange={(event) => setColor(event.target.value)}
              type="color"
              value={color}
            />
          ) : (
            <Input
              aria-label="Descrição"
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Descrição opcional"
              value={details}
            />
          )}
          <div className="flex gap-2">
            <Button disabled={pending} type="submit">
              <Plus className="size-4" /> {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
            {editingId ? (
              <Button onClick={reset} type="button" variant="outline">
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      )}
      {query.isLoading ? (
        <StatePanel kind="loading">Carregando...</StatePanel>
      ) : query.error ? (
        <StatePanel kind="error">{query.error.message}</StatePanel>
      ) : (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          {query.data?.length ? (
            query.data.map((row) => (
              <div
                className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center"
                key={row.id}
              >
                {kind === 'tags' ? (
                  <span
                    className="size-4 rounded-full"
                    style={{ backgroundColor: colorOf(row) ?? '#94A3B8' }}
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{row.name}</p>
                  {descriptionOf(row) ? (
                    <p className="text-sm text-muted-foreground">{descriptionOf(row)}</p>
                  ) : null}
                  {!activeOf(row) ? <p className="text-xs text-amber-600">Inativo</p> : null}
                </div>
                {canManage ? (
                  <div className="flex gap-2">
                    {'is_active' in row ? (
                      <Button
                        disabled={pending}
                        onClick={() =>
                          mutations.update.mutate({
                            id: row.id,
                            name: row.name,
                            description: descriptionOf(row) ?? '',
                            color: colorOf(row) ?? '',
                            isActive: !activeOf(row),
                          })
                        }
                        variant="outline"
                      >
                        {activeOf(row) ? 'Desativar' : 'Ativar'}
                      </Button>
                    ) : null}
                    <Button
                      aria-label={`Editar ${row.name}`}
                      className="size-10 px-0"
                      onClick={() => {
                        setEditingId(row.id)
                        setName(row.name)
                        setDetails(descriptionOf(row) ?? '')
                        setColor(colorOf(row) ?? '#2563EB')
                      }}
                      variant="outline"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      aria-label={`Excluir ${row.name}`}
                      className="size-10 px-0"
                      disabled={pending}
                      onClick={() => {
                        setDeletingRow(row)
                      }}
                      variant="outline"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <StatePanel>Nenhum item cadastrado.</StatePanel>
          )}
        </section>
      )}
      {error ? <StatePanel kind="error">{error.message}</StatePanel> : null}
      <ConfirmDialog
        confirmLabel="Excluir item"
        description={`“${deletingRow?.name ?? ''}” será removido desta organização.`}
        onCancel={() => setDeletingRow(null)}
        onConfirm={() => {
          if (deletingRow)
            mutations.remove.mutate(deletingRow.id, { onSuccess: () => setDeletingRow(null) })
        }}
        open={Boolean(deletingRow)}
        pending={mutations.remove.isPending}
        title="Excluir este item?"
      />
    </div>
  )
}
