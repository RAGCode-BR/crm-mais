import { zodResolver } from '@hookform/resolvers/zod'
import { ListChecks, MessageSquareText, Tags, Trash2, UserRoundCog, Workflow } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  useActiveCadenceOptions,
  useEnrollProspectingItems,
} from '@/features/cadences/cadence.hooks'

import { prospectingActivityTypes, prospectingItemStatuses } from '../prospecting.constants'
import {
  useApplyProspectingTags,
  useRecordProspectingActivity,
  useRemoveProspectingItems,
  useUpdateProspectingItems,
} from '../prospecting.hooks'
import { bulkActivitySchema, type BulkActivityFormValues } from '../prospecting.schemas'
import type { ProspectingLookups } from '../prospecting.types'

export function ProspectingBulkActions({
  actorMemberId,
  listId,
  lookups,
  onDone,
  organizationId,
  selectedIds,
}: {
  actorMemberId: string
  listId: string
  lookups: ProspectingLookups
  onDone: () => void
  organizationId: string
  selectedIds: string[]
}) {
  const [assigneeId, setAssigneeId] = useState('')
  const [status, setStatus] = useState('')
  const [tagId, setTagId] = useState('')
  const [showActivity, setShowActivity] = useState(false)
  const [showCadence, setShowCadence] = useState(false)
  const [cadenceId, setCadenceId] = useState('')
  const [cadenceAssigneeId, setCadenceAssigneeId] = useState(actorMemberId)
  const updateItems = useUpdateProspectingItems(organizationId, listId)
  const applyTags = useApplyProspectingTags(organizationId, listId)
  const removeItems = useRemoveProspectingItems(organizationId, listId)
  const recordActivity = useRecordProspectingActivity(organizationId, listId)
  const cadenceOptions = useActiveCadenceOptions(organizationId)
  const enrollCadence = useEnrollProspectingItems(organizationId, listId)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<BulkActivityFormValues>({
    defaultValues: { type: 'call', subject: 'Contato de prospecção', description: '' },
    resolver: zodResolver(bulkActivitySchema),
  })
  const busy =
    updateItems.isPending ||
    applyTags.isPending ||
    removeItems.isPending ||
    recordActivity.isPending ||
    enrollCadence.isPending
  const finish = () => {
    onDone()
    setShowActivity(false)
    setShowCadence(false)
  }
  const submitActivity = handleSubmit(async (values) => {
    await recordActivity.mutateAsync({
      ...values,
      itemIds: selectedIds,
      actorMemberId,
    })
    reset(values)
    finish()
  })
  const error =
    updateItems.error ??
    applyTags.error ??
    removeItems.error ??
    recordActivity.error ??
    enrollCadence.error ??
    cadenceOptions.error ??
    null

  return (
    <section className="rounded-xl border border-primary/30 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {selectedIds.length} selecionado{selectedIds.length === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-muted-foreground">As ações serão aplicadas em lote.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowActivity((current) => !current)} variant="outline">
            <MessageSquareText className="size-4" /> Registrar ação
          </Button>
          <Button onClick={() => setShowCadence((current) => !current)} variant="outline">
            <Workflow className="size-4" /> Iniciar cadência
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              await removeItems.mutateAsync(selectedIds)
              finish()
            }}
            variant="ghost"
          >
            <Trash2 className="size-4" /> Remover
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-3">
        <div className="flex gap-2">
          <Select onChange={(event) => setAssigneeId(event.target.value)} value={assigneeId}>
            <option value="">Responsável...</option>
            <option value="__none__">Sem responsável</option>
            {lookups.members.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </Select>
          <Button
            aria-label="Atribuir responsável"
            className="shrink-0 px-3"
            disabled={!assigneeId || busy}
            onClick={async () => {
              await updateItems.mutateAsync({
                itemIds: selectedIds,
                assignedMemberId: assigneeId === '__none__' ? null : assigneeId,
              })
              finish()
            }}
            variant="outline"
          >
            <UserRoundCog className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">Alterar status...</option>
            {prospectingItemStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            aria-label="Alterar status"
            className="shrink-0 px-3"
            disabled={!status || busy}
            onClick={async () => {
              await updateItems.mutateAsync({
                itemIds: selectedIds,
                status: status as Parameters<typeof updateItems.mutateAsync>[0]['status'],
              })
              finish()
            }}
            variant="outline"
          >
            <ListChecks className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Select onChange={(event) => setTagId(event.target.value)} value={tagId}>
            <option value="">Adicionar tag...</option>
            {lookups.tags.map((tag) => (
              <option key={tag.value} value={tag.value}>
                {tag.label}
              </option>
            ))}
          </Select>
          <Button
            aria-label="Adicionar tag"
            className="shrink-0 px-3"
            disabled={!tagId || busy}
            onClick={async () => {
              await applyTags.mutateAsync({ itemIds: selectedIds, tagIds: [tagId] })
              finish()
            }}
            variant="outline"
          >
            <Tags className="size-4" />
          </Button>
        </div>
      </div>
      {showActivity ? (
        <form
          className="mt-4 grid gap-3 rounded-lg bg-muted/50 p-4 md:grid-cols-2"
          onSubmit={(event) => void submitActivity(event)}
        >
          <FormField error={errors.type?.message} label="Tipo" required>
            <Select {...register('type')}>
              {prospectingActivityTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField error={errors.subject?.message} label="Assunto" required>
            <Input {...register('subject')} />
          </FormField>
          <div className="md:col-span-2">
            <FormField error={errors.description?.message} label="Descrição">
              <Textarea {...register('description')} />
            </FormField>
          </div>
          <div className="flex justify-end md:col-span-2">
            <Button disabled={busy} type="submit">
              {recordActivity.isPending ? 'Registrando...' : 'Registrar para selecionados'}
            </Button>
          </div>
        </form>
      ) : null}
      {showCadence ? (
        <div className="mt-4 grid gap-3 rounded-lg bg-muted/50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <FormField label="Cadência ativa" required>
            <Select onChange={(event) => setCadenceId(event.target.value)} value={cadenceId}>
              <option value="">Selecione...</option>
              {(cadenceOptions.data ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Responsável pelas tarefas" required>
            <Select
              onChange={(event) => setCadenceAssigneeId(event.target.value)}
              value={cadenceAssigneeId}
            >
              <option value="">Selecione...</option>
              {lookups.members.map((member) => (
                <option key={member.value} value={member.value}>
                  {member.label}
                </option>
              ))}
            </Select>
          </FormField>
          <Button
            disabled={!cadenceId || !cadenceAssigneeId || busy}
            onClick={async () => {
              await enrollCadence.mutateAsync({
                assignedMemberId: cadenceAssigneeId,
                cadenceId,
                itemIds: selectedIds,
              })
              finish()
            }}
          >
            {enrollCadence.isPending ? 'Iniciando...' : 'Confirmar'}
          </Button>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error.message}</p> : null}
    </section>
  )
}
