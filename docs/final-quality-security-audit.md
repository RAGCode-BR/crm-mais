# Auditoria final de qualidade e segurança

## Escopo

Revisão final do CRM após os blocos funcionais, cobrindo experiência, acessibilidade, desempenho,
autorização multi-tenant, Storage, Edge Functions, dependências e variáveis de ambiente.

## Experiência e acessibilidade

- Páginas permanecem separadas por rota e carregadas sob demanda.
- Ações destrutivas usam diálogo acessível com título, descrição, foco inicial e fechamento por
  `Escape`.
- Busca, badges, avatar e skeleton foram padronizados em componentes reutilizáveis.
- Estados de erro usam `role="alert"`; carregamento e vazios usam regiões anunciáveis.
- Foco visível global e preferência por movimento reduzido foram adicionados.
- Login e cadastro foram verificados visualmente em viewport desktop e móvel.

## Desempenho

- Listagens principais possuem paginação ou limites explícitos.
- O catálogo de configurações seleciona somente colunas necessárias, sem `SELECT *`.
- Membros e perfis são carregados em uma única consulta relacional, evitando consulta duplicada e
  N+1.
- Páginas continuam usando lazy loading por rota.
- Relatórios pesados só são consultados em suas páginas específicas.

## Segurança

- Autenticação usa sessão do Supabase e rotas protegidas.
- RLS está ativo nas tabelas públicas e a autorização é aplicada no banco, não apenas na interface.
- Testes de banco simulam usuários de organizações diferentes e verificam leitura, alteração,
  exclusão, relacionamentos e arquivos privados.
- A chave `service_role` existe somente na Edge Function de convite e não é exposta ao Vite.
- Edge Functions verificam JWT e validam organização, papel e entradas.
- Storage utiliza bucket privado, caminhos por organização e URLs temporárias.
- Não foram encontrados usos de `eval`, `dangerouslySetInnerHTML`, `innerHTML`, logs sensíveis ou
  segredos no frontend.
- `npm audit` não encontrou vulnerabilidades de produção nem de desenvolvimento.
- O lint remoto do banco não encontrou erros nos schemas `public`, `private` e `extensions`.

## Riscos operacionais conhecidos

- A proteção contra senhas vazadas deve ser ativada no painel de autenticação do Supabase; é uma
  configuração de projeto, não uma migration SQL da aplicação.
- As RPCs privilegiadas de scoring e cadências são `SECURITY DEFINER` por necessidade operacional,
  mas possuem `search_path` vazio, validação explícita de papel/organização e privilégios restritos a
  usuários autenticados. Alterações nelas exigem nova revisão de segurança.
- Convites por e-mail dependem da configuração de SMTP e das URLs de redirecionamento do projeto
  Supabase em produção.
