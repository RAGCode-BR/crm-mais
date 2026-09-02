import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { loadTaskLookups } from '../task.service'
import { taskPriorityOptions, taskStatusOptions, taskTypeOptions } from '../task.constants'
import { taskSchema } from '../task.schemas'
import type { TaskInput } from '../task.types'

type TaskLookups = Awaited<ReturnType<typeof loadTaskLookups>>

export function TaskForm({
  backTo,
  defaultValues,
  isSaving,
  lookups,
  onSave,
}: {
  backTo: string
  defaultValues: TaskInput
  isSaving: boolean
  lookups: TaskLookups
  onSave: (input: TaskInput) => Promise<void>
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<TaskInput>({ defaultValues, resolver: zodResolver(taskSchema) })

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSave)(event)}>
      <section className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormField error={errors.title?.message} label="Título" required>
            <Input autoFocus {...register('title')} />
          </FormField>
        </div>
        <FormField error={errors.type?.message} label="Tipo" required>
          <Select {...register('type')}>
            {taskTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.priority?.message} label="Prioridade" required>
          <Select {...register('priority')}>
            {taskPriorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.assignedMemberId?.message} label="Responsável" required>
          <Select {...register('assignedMemberId')}>
            <option value="">Selecione...</option>
            {lookups.members.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.dueAt?.message} label="Vencimento" required>
          <Input type="datetime-local" {...register('dueAt')} />
        </FormField>
        <FormField error={errors.status?.message} label="Status" required>
          <Select {...register('status')}>
            {taskStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.companyId?.message} label="Empresa">
          <Select
            {...register('companyId', {
              onChange: () => {
                setValue('contactId', '')
                setValue('leadId', '')
                setValue('opportunityId', '')
              },
            })}
          >
            <option value="">Sem empresa</option>
            {lookups.companies.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.contactId?.message} label="Contato">
          <Select
            {...register('contactId', {
              onChange: (event) => {
                const contact = lookups.contacts.find((item) => item.value === event.target.value)
                if (contact) setValue('companyId', contact.companyId)
              },
            })}
          >
            <option value="">Sem contato</option>
            {lookups.contacts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.leadId?.message} label="Lead">
          <Select
            {...register('leadId', {
              onChange: (event) => {
                const lead = lookups.leads.find((item) => item.value === event.target.value)
                if (lead?.companyId) setValue('companyId', lead.companyId)
              },
            })}
          >
            <option value="">Sem lead</option>
            {lookups.leads.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.opportunityId?.message} label="Oportunidade">
          <Select
            {...register('opportunityId', {
              onChange: (event) => {
                const opportunity = lookups.opportunities.find(
                  (item) => item.value === event.target.value,
                )
                if (!opportunity) return
                setValue('companyId', opportunity.companyId)
                setValue('contactId', opportunity.contactId)
                setValue('leadId', opportunity.leadId)
              },
            })}
          >
            <option value="">Sem oportunidade</option>
            {lookups.opportunities.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="md:col-span-2">
          <FormField error={errors.description?.message} label="Descrição">
            <Textarea rows={5} {...register('description')} />
          </FormField>
        </div>
      </section>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
          to={backTo}
        >
          Cancelar
        </Link>
        <Button disabled={isSaving} type="submit">
          {isSaving ? 'Salvando...' : 'Salvar tarefa'}
        </Button>
      </div>
    </form>
  )
}
