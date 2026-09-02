# Convenções de desenvolvimento

## Código e nomes

- Arquivos React e componentes: `PascalCase.tsx`.
- Cada página possui um arquivo próprio terminado em `Page.tsx`; páginas distintas nunca são
  declaradas no mesmo arquivo.
- Hooks: `useNome.ts`.
- Schemas: `nome.schema.ts`.
- Serviços de dados: `nome.service.ts`.
- Testes: próximos do código, com `.test.ts` ou `.test.tsx`.
- Arquivos `index.ts` contêm somente exports e não implementam páginas, componentes ou regras.
- Imports compartilhados usam o alias `@/`; imports internos curtos podem ser relativos.
- Tipos desconhecidos começam como `unknown` e são refinados. `any` exige comentário justificando.

## Features

Cada feature expõe somente a API necessária por um `index.ts`. Uma feature não importa caminhos
internos de outra. Regras reutilizadas por múltiplos domínios devem ser movidas apenas após a
necessidade ser comprovada.

As páginas ficam em `features/<domínio>/pages` quando pertencem a um domínio. Páginas realmente
transversais podem ficar em `src/pages`, sempre mantendo um arquivo por página. O arquivo de rotas
somente importa essas páginas e define o mapeamento de URLs.

## Dados e cache

- Query keys: `[organizationId, domain, resource, params]`.
- Consultas selecionam somente colunas necessárias e usam paginação.
- Mutações invalidam a menor chave afetada.
- Erros de infraestrutura são convertidos em erros de aplicação compreensíveis na camada de dados.
- Datas persistidas em UTC; formatação e fuso horário somente na apresentação.

## Formulários

- Zod define o contrato de entrada.
- React Hook Form controla o formulário e usa resolver Zod.
- Validação do frontend melhora UX, mas constraints e políticas do banco permanecem obrigatórias.

## Banco e Supabase

- Toda mudança nasce em migration versionada criada pela CLI.
- Objetos novos usam grants mínimos; tabelas expostas têm RLS habilitado explicitamente.
- Policies de `UPDATE` têm `USING` e `WITH CHECK`, além de policy de `SELECT` compatível.
- Views expostas usam `security_invoker` quando suportado.
- Nenhum segredo é versionado; o frontend aceita somente URL e publishable key.
- Tipos do banco serão gerados após o schema do Bloco 1 existir.

## Qualidade

Antes de concluir um bloco:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. validações específicas de migrations, RLS e banco quando aplicáveis

Mudanças devem incluir teste proporcional ao risco e documentação de pendências de blocos futuros.
