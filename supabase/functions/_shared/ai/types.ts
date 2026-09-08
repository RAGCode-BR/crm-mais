export type AiMode = 'company_summary' | 'commercial_assistant' | 'next_best_action'

export type ProviderInput = {
  systemPrompt: string
  userPrompt: string
  schema: Record<string, unknown>
  safetyIdentifier: string
}

export type ProviderOutput = {
  data: unknown
  model: string
}

export interface AiProvider {
  readonly name: string
  generate(input: ProviderInput): Promise<ProviderOutput>
}
