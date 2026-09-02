# Auditoria técnica — Bloco 0

Data: 02/09/2026

## Estado encontrado

O diretório do projeto estava completamente vazio: sem repositório Git, arquivos de aplicação,
dependências, variáveis de ambiente, configuração Supabase, autenticação, banco, migrations,
componentes, rotas, build, lint ou testes. Portanto, não havia funcionalidade existente a preservar
nem schema remoto/local informado para auditar.

## Ambiente disponível

- Node.js: 24.18.0
- npm/npx: 11.16.0
- Supabase CLI global: 2.110.0
- Git: disponível; repositório inicializado em `main`
- Docker: não instalado ou indisponível no `PATH`

## Fundação criada

- SPA React/TypeScript sobre Vite.
- Tailwind CSS com tokens semânticos e suporte light/dark.
- Configuração shadcn/ui e Lucide Icons.
- TanStack Query como provider global.
- Cliente Supabase opcional e seguro, validado com Zod.
- React Router com rota inicial e tratamento de 404.
- TypeScript estrito, ESLint, Prettier, Vitest e Testing Library.
- Supabase CLI inicializado, sem migrations ou mudanças de banco.
- Documentação de arquitetura, convenções e fronteiras dos blocos.

## Decisões e riscos

1. **Banco não acessível:** não existe referência de projeto remoto, credenciais ou stack local em
   execução. Nenhuma inferência foi feita sobre tabelas ou autenticação.
2. **Docker ausente:** impede `supabase start`, reset local, advisors e testes reais de RLS. Isso será
   necessário para validar os Blocos 1 e 2 localmente, salvo uso de um projeto remoto autorizado.
3. **Data API com exposição opt-in:** mudanças recentes do Supabase exigem grants explícitos além de
   RLS. A arquitetura adotará ambos nos próximos blocos.
4. **Escopo preservado:** não foram criadas entidades comerciais, migrations, autenticação,
   dashboard, pipeline ou regras futuras.

## Próximo bloco

O Bloco 1 modelará o schema PostgreSQL, constraints, índices, triggers técnicos, migrations
versionadas e tipos TypeScript. RLS baseada em organizações e autenticação permanecem reservadas ao
Bloco 2, embora toda tabela exposta seja criada com postura segura desde o início.
