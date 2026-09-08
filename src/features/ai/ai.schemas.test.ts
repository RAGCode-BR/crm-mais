import { aiResponseSchema } from './ai.schemas'

describe('aiResponseSchema', () => {
  it('accepts advice that requires human confirmation', () => {
    expect(
      aiResponseSchema.safeParse({
        title: 'Próxima melhor ação',
        answer: 'Revise a oportunidade antes de entrar em contato.',
        evidence: ['Score alto'],
        suggestedActions: [
          {
            label: 'Revisar oportunidade',
            path: '/oportunidades/00000000-0000-4000-8000-000000000000',
            reason: 'Fechamento próximo',
            requiresConfirmation: true,
          },
        ],
        generatedAt: '2026-09-08T18:00:00.000Z',
        provider: 'openai',
        model: 'configured-model',
      }).success,
    ).toBe(true)
  })

  it('rejects an action that bypasses confirmation', () => {
    const result = aiResponseSchema.safeParse({
      title: 'Ação',
      answer: 'Mensagem enviada.',
      evidence: [],
      suggestedActions: [
        { label: 'Enviar', path: '/tarefas', reason: 'Automático', requiresConfirmation: false },
      ],
      generatedAt: '2026-09-08T18:00:00.000Z',
      provider: 'openai',
      model: 'configured-model',
    })
    expect(result.success).toBe(false)
  })
})
