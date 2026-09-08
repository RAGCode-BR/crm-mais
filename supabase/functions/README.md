# Edge Functions

## `commercial-ai`

Endpoint autenticado e somente leitura para resumo de empresas, consultas comerciais e próxima
melhor ação. O cliente do banco reutiliza o JWT do usuário, portanto todas as consultas continuam
limitadas pelas políticas RLS da organização.

O provedor é selecionado por `AI_PROVIDER`; cada integração implementa o contrato `AiProvider` em
`_shared/ai/types.ts`. A implementação inicial usa a Responses API da OpenAI com saída estruturada,
sem persistir a resposta no provedor (`store: false`).

Secrets obrigatórios no projeto hospedado:

- `AI_PROVIDER=openai` (opcional enquanto OpenAI for o padrão)
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Configure-os pelo painel de Edge Function Secrets ou pela CLI, sem salvar valores no repositório.
Depois de configurados, os secrets ficam disponíveis imediatamente, sem novo deploy.
