import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

import {
  activityTypeValues,
  leadStatusValues,
  leadTemperatureValues,
  scoringRuleTypes,
} from '../scoring.constants'
import { scoringRuleSchema } from '../scoring.schemas'
import type { ScoringRuleInput } from '../scoring.types'

export function ScoringRuleForm({
  defaultValues,
  isSaving,
  onSave,
}: {
  defaultValues: ScoringRuleInput
  isSaving: boolean
  onSave: (input: ScoringRuleInput) => Promise<void>
}) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<ScoringRuleInput>({ defaultValues, resolver: zodResolver(scoringRuleSchema) })
  const ruleType = useWatch({ control, name: 'ruleType' })
  const selectValues =
    ruleType === 'lead_status'
      ? leadStatusValues
      : ruleType === 'lead_temperature'
        ? leadTemperatureValues
        : ruleType === 'activity_type_exists'
          ? activityTypeValues
          : null
  const help = scoringRuleTypes.find(({ value }) => value === ruleType)?.help
  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSave)(event)}>
      <section className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField error={errors.name?.message} label="Nome da regra" required>
          <Input {...register('name')} />
        </FormField>
        <FormField error={errors.ruleType?.message} label="Tipo de condição" required>
          <Select {...register('ruleType', { onChange: () => setValue('conditionValue', '') })}>
            {scoringRuleTypes.map((option) => (
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
        <FormField
          description={help}
          error={errors.conditionValue?.message}
          label="Valor da condição"
          required
        >
          {selectValues ? (
            <Select {...register('conditionValue')}>
              <option value="">Selecione...</option>
              {selectValues.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              min="0"
              placeholder={ruleType === 'company_industry' ? 'Ex.: Construção civil' : 'Ex.: 15'}
              type={ruleType === 'company_industry' ? 'text' : 'number'}
              {...register('conditionValue')}
            />
          )}
        </FormField>
        <FormField
          description="Use valor negativo para reduzir a prioridade."
          error={errors.points?.message}
          label="Pontos"
          required
        >
          <Input
            max="100"
            min="-100"
            type="number"
            {...register('points', { valueAsNumber: true })}
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input className="size-4" type="checkbox" {...register('isActive')} /> Regra ativa
        </label>
      </section>
      <div className="flex justify-end gap-3">
        <Link
          className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium"
          to="/inteligencia/scoring/regras"
        >
          Cancelar
        </Link>
        <Button disabled={isSaving} type="submit">
          {isSaving ? 'Salvando...' : 'Salvar regra'}
        </Button>
      </div>
    </form>
  )
}
