# CRM+

CRM+ é uma plataforma multiempresa para gestão de prospecção, relacionamento e operação
comercial. Reúne o funil de vendas, cadências, tarefas, relatórios e inteligência comercial em uma
aplicação web única, com dados protegidos por Supabase Auth e Row Level Security (RLS).

## Visão do produto

- **Organizações e acesso:** criação de workspaces, seleção da organização ativa, membros,
  equipes e permissões por papel.
- **CRM comercial:** empresas, contatos, leads, oportunidades, pipelines e atividades.
- **Rotina de vendas:** tarefas pessoais, agenda, timeline, cadências e listas de prospecção.
- **Gestão e análise:** dashboard comercial, prioridades, relatórios, análise de perdas e
  auditoria.
- **Configurações:** origens de lead, tags, motivos de perda, dados da organização e preferências
  pessoais.
- **Assistente comercial:** recurso opcional baseado em uma Supabase Edge Function; só aparece
  quando habilitado no frontend e configurado com segurança no backend.

## Tecnologia

| Camada               | Tecnologia                                               |
| -------------------- | -------------------------------------------------------- |
| Interface            | React 19, TypeScript, Vite, Tailwind CSS e Lucide        |
| Estado e formulários | TanStack Query, React Hook Form e Zod                    |
| Autenticação e dados | Supabase Auth, PostgreSQL, RLS, Storage e Edge Functions |
| Qualidade            | ESLint, Prettier, Vitest e testes de schema com PGlite   |
| Hospedagem           | Cloudflare Pages ou Cloudflare Workers                   |

## Segurança e isolamento

O CRM nunca usa chaves administrativas no navegador. O frontend recebe somente a URL pública e a
publishable key do Supabase. A autorização definitiva acontece no PostgreSQL:

- Dados multiempresa são separados por `organization_id`.
- RLS valida a associação ativa e o papel do usuário em cada operação.
- A organização selecionada na interface serve à navegação, mas não concede acesso por si só.
- Somente owners podem renomear ou excluir uma organização.
- Segredos, como `OPENAI_API_KEY` e `service_role`, ficam exclusivamente em Edge Functions ou no
  provedor de hospedagem apropriado.

Consulte a [arquitetura](docs/architecture.md), a [matriz de autorização](docs/auth-and-authorization.md)
e o [schema de banco](docs/database-schema.md) para os detalhes técnicos.

## Requisitos

- Node.js 22 ou superior
- npm 11 ou superior
- Supabase CLI 2.110 ou superior para migrations e Edge Functions
- Docker ou runtime compatível apenas para executar o Supabase localmente

## Configuração local

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Crie o ambiente local:

   ```bash
   cp .env.example .env.local
   ```

3. Preencha as variáveis públicas do Supabase em `.env.local`:

   ```dotenv
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-publishable-key
   VITE_AI_ENABLED=false
   ```

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

`VITE_AI_ENABLED` deve permanecer `false` até que a Edge Function `commercial-ai` esteja
configurada. Nunca adicione `service_role`, chaves da OpenAI ou outros segredos ao `.env.local`
do Vite.

## Banco de dados e Supabase

As migrations estão em `supabase/migrations`. Para sincronizar um projeto remoto autorizado:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

As Edge Functions e seus secrets são descritos em [supabase/functions/README.md](supabase/functions/README.md).
Ao configurar domínio local ou de produção, atualize o **Site URL** e as **Redirect URLs** em
Supabase Auth para permitir login, cadastro e recuperação de senha.

## Qualidade

| Comando             | Finalidade                              |
| ------------------- | --------------------------------------- |
| `npm run typecheck` | Verifica os tipos TypeScript            |
| `npm run lint`      | Executa as regras de lint               |
| `npm run test`      | Executa a suíte de testes               |
| `npm run build`     | Gera o pacote de produção em `dist`     |
| `npm run validate`  | Executa typecheck, lint, testes e build |
| `npm run preview`   | Serve localmente o build de produção    |

Antes de abrir um pull request ou publicar, execute:

```bash
npm run validate
```

## Deploy no Cloudflare

O projeto já está pronto para ser hospedado como SPA. O fallback de rotas está em
`public/_redirects`, os cabeçalhos de segurança em `public/_headers` e a configuração de Workers
em [wrangler.jsonc](wrangler.jsonc).

### Cloudflare Pages

Conecte o repositório ao Cloudflare Pages e informe:

| Campo                 | Valor           |
| --------------------- | --------------- |
| Comando de instalação | `npm ci`        |
| Comando de build      | `npm run build` |
| Diretório de saída    | `dist`          |

Cadastre, antes do build, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e
`VITE_AI_ENABLED` nas configurações de Production e, se usado, Preview.

### Cloudflare Workers

Após autenticar o Wrangler na conta Cloudflare correta:

```bash
# Valida o pacote, sem publicar
npm run deploy:cloudflare:dry-run

# Publica o CRM
npm run deploy:cloudflare
```

Depois de obter o domínio do Cloudflare, configure-o no Supabase em **Authentication > URL
Configuration** como Site URL e Redirect URL (por exemplo, `https://crm.exemplo.com/*`).

O guia detalhado está em [docs/cloudflare-deployment.md](docs/cloudflare-deployment.md).

## Estrutura do repositório

```text
src/
  app/            # Bootstrap, providers e composição global
  components/     # Componentes reutilizáveis
  features/       # Domínios do CRM e suas páginas, hooks e serviços
  layouts/        # Estrutura visual autenticada
  lib/            # Cliente Supabase e utilitários compartilhados
  routes/         # Mapeamento de rotas da SPA
  styles/         # Tokens e estilos globais
  test/           # Setup e testes de interface/schema
supabase/
  migrations/     # Evolução versionada do PostgreSQL
  functions/      # Edge Functions e integrações privilegiadas
docs/             # Arquitetura, segurança e guias operacionais
```

## Documentação complementar

- [Arquitetura técnica](docs/architecture.md)
- [Convenções de desenvolvimento](docs/conventions.md)
- [Autenticação e autorização](docs/auth-and-authorization.md)
- [Modelo de dados](docs/database-schema.md)
- [Guia de deploy no Cloudflare](docs/cloudflare-deployment.md)
- [Auditoria final de qualidade e segurança](docs/final-quality-security-audit.md)

Cada página deve possuir seu próprio arquivo `*Page.tsx`. Arquivos `index.ts` são usados somente
para exports e nunca como contêiner de múltiplas páginas.
