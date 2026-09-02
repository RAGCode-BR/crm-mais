import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { pipelineSchema } from '../pipeline.schemas'
import type { PipelineInput } from '../pipeline.types'

export function PipelineForm({
  backTo,
  defaultValues,
  isSaving,
  onSave,
}: {
  backTo: string
  defaultValues: PipelineInput
  isSaving: boolean
  onSave: (input: PipelineInput) => Promise<void>
}) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<PipelineInput>({ defaultValues, resolver: zodResolver(pipelineSchema) })
  const { append, fields, move, remove } = useFieldArray({ control, name: 'stages' })
  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSave)(event)}>
      <section className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField error={errors.name?.message} label="Nome do pipeline" required>
          <Input {...register('name')} />
        </FormField>
        <div className="flex flex-wrap items-center gap-6 pt-7">
          <label className="flex items-center gap-2 text-sm">
            <input className="size-4" type="checkbox" {...register('isDefault')} />
            Pipeline padrão
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input className="size-4" type="checkbox" {...register('isActive')} />
            Ativo
          </label>
        </div>
        <div className="md:col-span-2">
          <FormField error={errors.description?.message} label="Descrição">
            <Textarea {...register('description')} />
          </FormField>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-semibold">Etapas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A ordem abaixo será usada no Kanban.
            </p>
          </div>
          <Button
            onClick={() => append({ name: '', probability: 0, isWon: false, isLost: false })}
            variant="outline"
          >
            <Plus className="size-4" />
            Adicionar etapa
          </Button>
        </div>
        <div className="divide-y divide-border">
          {fields.map((field, index) => (
            <div
              className="grid gap-3 p-4 md:grid-cols-[auto_1fr_150px_auto_auto] md:items-start"
              key={field.id}
            >
              <span className="mt-3 grid size-7 place-items-center rounded-full bg-muted text-xs font-semibold">
                {index + 1}
              </span>
              <FormField error={errors.stages?.[index]?.name?.message} label="Nome">
                <Input {...register(`stages.${index}.name`)} />
                <input type="hidden" {...register(`stages.${index}.id`)} />
              </FormField>
              <FormField error={errors.stages?.[index]?.probability?.message} label="Probabilidade">
                <Input
                  max="100"
                  min="0"
                  type="number"
                  {...register(`stages.${index}.probability`, { valueAsNumber: true })}
                />
              </FormField>
              <div className="flex gap-4 pt-8">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" {...register(`stages.${index}.isWon`)} />
                  Ganho
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" {...register(`stages.${index}.isLost`)} />
                  Perdido
                </label>
              </div>
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
        {errors.stages?.root?.message ? (
          <p className="p-4 text-sm text-red-600">{errors.stages.root.message}</p>
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
          {isSaving ? 'Salvando...' : 'Salvar pipeline'}
        </Button>
      </div>
    </form>
  )
}
