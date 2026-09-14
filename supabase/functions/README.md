# Edge Functions

## `commercial-ai`

Endpoint autenticado e somente leitura para resumo de empresas, consultas comerciais e próxima
melhor ação. O cliente do banco reutiliza o JWT do usuário, portanto todas as consultas continuam
limitadas pelas políticas RLS da organização.

O provedor é selecionado por `AI_PROVIDER`; cada integração implementa o contrato `AiProvider` em
`_shared/ai/types.ts`. OpenAI e Gemini usam saída estruturada, e a resposta é validada novamente
antes de chegar ao frontend. A integração OpenAI usa `store: false`.

Secrets obrigatórios no projeto hospedado:

Para OpenAI:

- `AI_PROVIDER=openai` (opcional enquanto OpenAI for o padrão)
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Para Gemini:

- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Configure-os pelo painel de Edge Function Secrets ou pela CLI, sem salvar valores no repositório.
Depois de configurados, os secrets ficam disponíveis imediatamente, sem novo deploy.

## `invite-member`

Endpoint autenticado para proprietários e administradores convidarem usuários para uma organização.
A função valida o JWT e o perfil do solicitante antes de usar a chave de serviço, disponível somente
no ambiente protegido da Edge Function, para criar o convite e a associação. Nenhuma chave
administrativa deve ser adicionada ao frontend ou ao `.env.local` do Vite.
