# Arquitetura técnica

## Objetivo

Manter a plataforma organizada por domínios comerciais, com isolamento multiempresa aplicado no
banco e uma interface rápida de evoluir sem acoplamento entre páginas, acesso a dados e regras de
negócio.

## Camadas

1. **Apresentação** — páginas, layouts e componentes React. Não contém autorização de segurança.
2. **Aplicação** — hooks, schemas Zod, casos de uso e coordenação de cache por feature.
3. **Dados** — serviços Supabase com seleções explícitas, paginação e tipos gerados do schema.
4. **Persistência e segurança** — PostgreSQL, constraints, índices, RLS, funções e migrations.
5. **Operações privilegiadas** — Edge Functions isoladas; segredos nunca chegam ao navegador.

## Organização por domínio

```text
src/
  app/                 # bootstrap e providers
  components/          # UI compartilhada
  features/
    auth/
    dashboard/
    leads/
    companies/
    contacts/
    opportunities/
    pipeline/
    activities/
    tasks/
    prospecting/
    reports/
    settings/
  hooks/               # apenas hooks verdadeiramente globais
  layouts/
  lib/                  # clientes externos e utilitários sem domínio
  pages/                # composição de features para rotas
  routes/
  services/             # serviços transversais, quando existirem
  styles/
  test/
  types/                # tipos compartilhados e tipos gerados
  utils/
supabase/
  migrations/
  functions/
  tests/
```

As pastas de domínio serão criadas quando seu bloco começar, evitando esqueletos vazios e imports
prematuros.

## Fluxo principal de dados

```text
Página → hook da feature → serviço tipado → Supabase Data API → PostgreSQL/RLS
                   ↘ TanStack Query (cache, loading, erro e invalidação)
```

- React Hook Form gerencia estado de formulário.
- Zod valida entrada na borda da interface e respostas externas quando necessário.
- O PostgreSQL continua sendo a autoridade final para integridade e autorização.
- TanStack Query usa chaves hierárquicas iniciadas por organização e domínio.

## Fronteiras do modelo

`lead`, `company`, `contact`, `opportunity` e `client` são conceitos distintos. Uma empresa pode ter
muitos contatos e oportunidades. O status de cliente será derivado de uma relação comercial ganha,
sem colapsar essas entidades em um cadastro genérico.

## Multiempresa e autorização

- Entidades organizacionais carregarão `organization_id` quando aplicável.
- A organização ativa será contexto de navegação, não fonte de autorização.
- RLS validará associação ativa em `organization_members` e papel permitido.
- Claims editáveis pelo usuário não serão usadas para autorização.
- Tabelas expostas receberão grants mínimos e RLS explícito por operação.
- Funções `security definer`, se inevitáveis, ficarão em schema privado, terão `search_path` fixo,
  checagem de usuário e grants explícitos.

O desenho detalhado de tabelas está em `database-schema.md`; autenticação, matriz de papéis,
policies e garantias de isolamento estão em `auth-and-authorization.md`.

## Decisões de frontend

- Vite e React SPA, com rotas carregáveis sob demanda quando os módulos crescerem.
- Cada página deve possuir seu próprio arquivo, por exemplo `LoginPage.tsx`, `DashboardPage.tsx`,
  `LeadsPage.tsx` e `CompanyDetailsPage.tsx`.
- Arquivos `index.ts` são pontos de exportação pública e nunca devem conter a implementação de
  várias páginas ou componentes.
- Rotas apenas relacionam URLs às páginas; regras de negócio e layouts não devem ser implementados
  diretamente no arquivo de rotas.
- TypeScript estrito, sem `any`, com `noUncheckedIndexedAccess`.
- Tailwind CSS com tokens semânticos e variante de dark mode por classe.
- shadcn/ui como código local e Lucide como biblioteca única de ícones.
- Estados de loading, erro e vazio são parte do contrato de cada tela.
- Componentes de domínio ficam na feature; componentes genéricos só sobem para `components` após
  uso comprovado em mais de um domínio.

## Organização das páginas

```text
src/
  features/
    auth/
      pages/
        LoginPage.tsx
        ForgotPasswordPage.tsx
      index.ts             # apenas exports
    dashboard/
      pages/
        DashboardPage.tsx
      index.ts             # apenas exports
    leads/
      pages/
        LeadsPage.tsx
        LeadDetailsPage.tsx
        NewLeadPage.tsx
      index.ts             # apenas exports
  routes/
    router.tsx             # mapeamento de rotas
```

Uma página pode ser dividida em componentes menores dentro da própria feature. O arquivo da página
fica responsável somente pela composição da tela e não deve crescer para concentrar outras páginas.

## Integrações futuras

E-mail, WhatsApp, telefonia e IA entrarão por interfaces de serviço independentes de fornecedor.
Chamadas privilegiadas ocorrerão em Edge Functions. Realtime, Cron e Queues só serão adotados com
caso de uso e custo operacional justificados.
