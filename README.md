# CRM+

Plataforma modular de prospecção e inteligência comercial. O desenvolvimento é incremental e
obedece aos blocos definidos no briefing do produto.

## Requisitos

- Node.js 22 ou superior
- npm 11 ou superior
- Supabase CLI 2.110 ou superior
- Docker ou runtime compatível (necessário apenas para executar o Supabase local)

## Primeiros passos

```bash
npm install
copy .env.example .env.local
npm run dev
```

Preencha em `.env.local` somente a URL pública do projeto e a publishable key. Nunca use a chave
`service_role` no frontend.

## Validação

```bash
npm run validate
```

Os comandos individuais são `typecheck`, `lint`, `test`, `build` e `format:check`.

## Estrutura

- `src/app`: composição e providers globais
- `src/components`: componentes reutilizáveis e componentes shadcn/ui
- `src/features`: módulos por domínio
- `src/lib`: integrações e utilitários compartilhados
- `src/pages`: páginas de composição
- `src/routes`: definição de rotas
- `src/styles`: tokens e estilos globais
- `src/test`: configuração e utilitários de testes
- `supabase`: configuração local, migrations e testes de banco
- `docs`: arquitetura, convenções e auditorias

Leia [docs/architecture.md](docs/architecture.md), [docs/conventions.md](docs/conventions.md) e
[docs/block-0-audit.md](docs/block-0-audit.md) antes de implementar novos módulos. O modelo atual do
banco está documentado em [docs/database-schema.md](docs/database-schema.md), e a matriz de acesso
está em [docs/auth-and-authorization.md](docs/auth-and-authorization.md).

Cada página deve possuir seu próprio arquivo `*Page.tsx`. Arquivos `index.ts` são usados somente
para exports e nunca como contêiner de múltiplas páginas.
