import { BrainCircuit, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useOrganization } from '@/features/organizations/useOrganization'

import { commercialQuestions } from '../ai.constants'
import { useCommercialAi } from '../ai.hooks'
import { AiResponsePanel } from '../components/AiResponsePanel'

export function CommercialAssistantPage() {
  const { activeOrganization } = useOrganization()
  const [question, setQuestion] = useState('')
  const ai = useCommercialAi()
  const organizationId = activeOrganization?.organizationId
  const ask = (value: string) => {
    if (!organizationId || !value.trim()) return
    setQuestion(value)
    ai.mutate({ mode: 'commercial_assistant', organizationId, question: value.trim() })
  }
  return (
    <div className="space-y-6">
      <PageHeader
        description="Faça perguntas sobre o funil e receba recomendações explicadas, sempre sujeitas à sua confirmação."
        title="Assistente comercial"
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {commercialQuestions.map((item) => (
          <button
            className="rounded-xl border border-border bg-card p-4 text-left text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            disabled={!organizationId || ai.isPending}
            key={item}
            onClick={() => ask(item)}
            type="button"
          >
            <BrainCircuit className="mb-3 size-5 text-primary" /> {item}
          </button>
        ))}
      </section>
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <label className="text-sm font-medium" htmlFor="commercial-question">
          Outra pergunta comercial
        </label>
        <Textarea
          id="commercial-question"
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ex.: quais negociações devo revisar antes da reunião de pipeline?"
          value={question}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!organizationId || !question.trim() || ai.isPending}
            onClick={() => ask(question)}
          >
            <Sparkles className="size-4" /> {ai.isPending ? 'Analisando...' : 'Analisar pergunta'}
          </Button>
          <Button
            disabled={!organizationId || ai.isPending}
            onClick={() =>
              organizationId && ai.mutate({ mode: 'next_best_action', organizationId })
            }
            variant="outline"
          >
            Recomendar próxima melhor ação
          </Button>
        </div>
      </section>
      {ai.error ? (
        <section className="rounded-xl border border-red-200 bg-card p-5 text-sm text-red-600 dark:border-red-900">
          {ai.error.message}
        </section>
      ) : null}
      {ai.data ? <AiResponsePanel response={ai.data} /> : null}
    </div>
  )
}
