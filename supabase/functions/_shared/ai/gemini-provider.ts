import type { AiProvider, ProviderInput, ProviderOutput } from './types.ts'

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
  error?: { message?: string }
  promptFeedback?: { blockReason?: string }
}

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini'

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generate(input: ProviderInput): Promise<ProviderOutput> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: input.userPrompt }] }],
          generationConfig: {
            maxOutputTokens: 1400,
            responseMimeType: 'application/json',
            responseJsonSchema: input.schema,
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    )
    const payload = (await response.json()) as GeminiResponse
    if (!response.ok)
      throw new Error(payload.error?.message ?? 'Falha ao consultar o provedor de IA.')

    const candidate = payload.candidates?.[0]
    const text = candidate?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim()
    if (!text) {
      const reason = payload.promptFeedback?.blockReason ?? candidate?.finishReason
      throw new Error(
        reason ? `O Gemini não retornou conteúdo (${reason}).` : 'O Gemini não retornou conteúdo.',
      )
    }
    try {
      return { data: JSON.parse(text), model: this.model }
    } catch {
      throw new Error('O Gemini retornou uma resposta em formato inválido.')
    }
  }
}
