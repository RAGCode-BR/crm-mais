# Autenticação e autorização

## Fluxo de autenticação

- O frontend usa somente a URL pública e a publishable key do Supabase.
- Cadastro, login, recuperação e troca de senha usam Supabase Auth.
- Um trigger em `auth.users` cria o perfil correspondente em `public.profiles`.
- `raw_user_meta_data.full_name` é copiado apenas como dado de apresentação e nunca participa de
  decisões de autorização.
- Rotas privadas aguardam a resolução da sessão e redirecionam usuários sem sessão para o login.

## Criação de organizações

O navegador gera o UUID e insere a organização sem solicitar `RETURNING`. Um trigger cria, na
mesma transação, o vínculo ativo do criador com papel `owner`. A consulta seguinte já é autorizada
pelo vínculo criado. Esse fluxo evita uma policy permanente baseada em `created_by`, que manteria
acesso indevido caso o criador fosse removido da organização.

## Matriz de papéis

| Papel   | Leitura | Operação comercial       | Configuração    | Membros                    | Excluir organização |
| ------- | ------- | ------------------------ | --------------- | -------------------------- | ------------------- |
| OWNER   | Sim     | Criar, alterar e excluir | Sim             | Gerenciar inclusive owners | Sim                 |
| ADMIN   | Sim     | Criar, alterar e excluir | Sim             | Gerenciar, exceto owners   | Não                 |
| MANAGER | Sim     | Criar, alterar e excluir | Sim             | Somente leitura            | Não                 |
| SALES   | Sim     | Criar e alterar          | Somente leitura | Somente leitura            | Não                 |
| VIEWER  | Sim     | Somente leitura          | Somente leitura | Somente leitura            | Não                 |

Notificações são visíveis apenas ao destinatário. Logs de auditoria são somente leitura para
`owner`, `admin` e `manager`; sua escrita continuará reservada a rotinas confiáveis do bloco de
auditoria.

## Garantias do banco

- Todas as tabelas públicas mantêm RLS habilitado.
- Policies são separadas por `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
- Funções de autorização ficam no schema `private`, usam `security definer`, `search_path` vazio e
  sempre vinculam a decisão a `auth.uid()`.
- `anon` não possui privilégios nas tabelas.
- `authenticated` recebe apenas os privilégios necessários para cada tabela/coluna.
- `organization_id` e `created_by` são imutáveis após a criação de registros multiempresa.
- A última associação OWNER ativa de uma organização não pode ser removida ou rebaixada.
- A organização selecionada no navegador melhora a navegação, mas nunca substitui o RLS.

## Configuração de URLs

Antes de publicar o frontend, configure no Supabase Auth a URL oficial do site e inclua
`/redefinir-senha` entre as URLs de redirecionamento permitidas. Em desenvolvimento, mantenha a URL
local usada pelo Vite na lista de redirecionamentos.
