import type { AiProvider, ProviderInput, ProviderOutput } from './types.ts'

type OpenAiResponse = {
  error?: { message?: string }
  output_text?: string
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>
}

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai'

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generate(input: ProviderInput): Promise<ProviderOutput> {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        instructions: input.systemPrompt,
        input: input.userPrompt,
        store: false,
        max_output_tokens: 1400,
        safety_identifier: input.safetyIdentifier,
        text: {
          format: {
            type: 'json_schema',
            name: 'commercial_guidance',
            strict: true,
            schema: input.schema,
          },
        },
      }),
      signal: AbortSignal.timeout(45_000),
    })
    const payload = (await response.json()) as OpenAiResponse
    if (!response.ok)
      throw new Error(payload.error?.message ?? 'Falha ao consultar o provedor de IA.')
    const text =
      payload.output_text ??
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((content) => content.type === 'output_text')?.text
    if (!text) throw new Error('O provedor de IA não retornou conteúdo.')
    return { data: JSON.parse(text), model: this.model }
  }
}
