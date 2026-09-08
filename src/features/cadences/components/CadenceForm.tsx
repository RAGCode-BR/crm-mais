import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

import { cadenceStatuses, cadenceTaskTypes } from '../cadence.constants'
import { cadenceSchema } from '../cadence.schemas'
import type { CadenceInput } from '../cadence.types'

export function CadenceForm({
  backTo,
  defaultValues,
  isSaving,
  onSave,
}: {
  backTo: string
  defaultValues: CadenceInput
  isSaving: boolean
  onSave: (input: CadenceInput) => Promise<void>
}) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CadenceInput>({ defaultValues, resolver: zodResolver(cadenceSchema) })
  const { append, fields, move, remove } = useFieldArray({ control, name: 'steps' })

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSave)(event)}>
      <section className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField error={errors.name?.message} label="Nome da cadência" required>
          <Input {...register('name')} />
        </FormField>
        <FormField error={errors.status?.message} label="Status" required>
          <Select {...register('status')}>
            {cadenceStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="md:col-span-2">
          <FormField error={errors.description?.message} label="Descrição">
            <Textarea {...register('description')} />
          </FormField>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-semibold">Sequência de tarefas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada etapa gera somente uma tarefa interna na data prevista.
            </p>
          </div>
          <Button
            onClick={() => append({ dayNumber: 1, type: 'call', title: '', description: '' })}
            variant="outline"
          >
            <Plus className="size-4" /> Adicionar etapa
          </Button>
        </div>
        <div className="divide-y divide-border">
          {fields.map((field, index) => (
            <div
              className="grid gap-3 p-4 lg:grid-cols-[auto_100px_150px_1fr_1fr_auto] lg:items-start"
              key={field.id}
            >
              <span className="mt-8 grid size-7 place-items-center rounded-full bg-muted text-xs font-semibold">
                {index + 1}
              </span>
              <FormField error={errors.steps?.[index]?.dayNumber?.message} label="Dia" required>
                <Input
                  min="1"
                  max="365"
                  type="number"
                  {...register(`steps.${index}.dayNumber`, { valueAsNumber: true })}
                />
              </FormField>
              <FormField error={errors.steps?.[index]?.type?.message} label="Ação" required>
                <Select {...register(`steps.${index}.type`)}>
                  {cadenceTaskTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField error={errors.steps?.[index]?.title?.message} label="Título" required>
                <Input {...register(`steps.${index}.title`)} />
              </FormField>
              <FormField error={errors.steps?.[index]?.description?.message} label="Orientação">
                <Input {...register(`steps.${index}.description`)} />
              </FormField>
              <div className="flex gap-1 pt-7">
                <Button
                  aria-label="Subir etapa"
                  className="size-9 px-0"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  variant="ghost"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  aria-label="Descer etapa"
                  className="size-9 px-0"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                  variant="ghost"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  aria-label="Remover etapa"
                  className="size-9 px-0 text-red-600"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {errors.steps?.root?.message ? (
          <p className="p-4 text-sm text-red-600">{errors.steps.root.message}</p>
        ) : null}
      </section>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
          to={backTo}
        >
          Cancelar
        </Link>
        <Button disabled={isSaving} type="submit">
          {isSaving ? 'Salvando...' : 'Salvar cadência'}
        </Button>
      </div>
    </form>
  )
}
