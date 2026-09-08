export type AiMode = 'company_summary' | 'commercial_assistant' | 'next_best_action'

export type AiRequest = {
  mode: AiMode
  organizationId: string
  companyId?: string
  question?: string
}

export type AiSuggestedAction = {
  label: string
  path: string
  reason: string
  requiresConfirmation: true
}

export type AiResponse = {
  title: string
  answer: string
  evidence: string[]
  suggestedActions: AiSuggestedAction[]
  generatedAt: string
  provider: string
  model: string
}
