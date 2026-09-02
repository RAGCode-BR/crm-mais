# Modelo de dados — Bloco 1

## Visão geral

O schema inicial contém 19 tabelas. Entidades comerciais são separadas e relacionadas; nenhum
registro genérico de "cliente" substitui leads, empresas, contatos ou oportunidades.

| Área        | Tabelas                                                      | Responsabilidade                                       |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| Identidade  | `profiles`, `organizations`, `organization_members`, `teams` | Pessoas, empresas usuárias e participação multiempresa |
| CRM         | `lead_sources`, `companies`, `contacts`, `leads`             | Prospecção e relacionamento comercial                  |
| Pipeline    | `pipelines`, `pipeline_stages`, `opportunities`              | Processos e negociações configuráveis                  |
| Engajamento | `activities`, `tasks`, `notes`, `tags`, `entity_tags`        | Histórico, trabalho e classificação                    |
| Sistema     | `attachments`, `notifications`, `audit_logs`                 | Arquivos, avisos e rastreabilidade futura              |

## Isolamento multiempresa

Todas as entidades pertencentes a uma organização contêm `organization_id`. Relacionamentos entre
essas entidades usam chaves estrangeiras compostas, como:

```text
(organization_id, company_id)
  → companies (organization_id, id)
```

Essa estrutura impede que um contato, lead, oportunidade ou tarefa da Organização A referencie uma
entidade da Organização B, mesmo fora da interface. As policies por usuário e papel serão adicionadas
no Bloco 2.

`profiles` é global porque uma pessoa poderá participar de várias organizações. A associação e o
papel ficam em `organization_members`.

## Integridade

- UUIDs são usados em identificadores expostos e distribuídos.
- Datas e horários usam `timestamptz`; datas comerciais sem horário usam `date`.
- Valores monetários usam `numeric(15, 2)`.
- Probabilidades e score ficam entre 0 e 100.
- Oportunidades ganhas/perdidas exigem encerramento; perdas exigem motivo.
- Tarefas concluídas exigem `completed_at`.
- Contatos vinculados a oportunidades precisam pertencer à empresa selecionada.
- Notas, anexos e tags polimórficas usam foreign keys explícitas e uma única entidade-pai.
- Há somente um contato principal ativo por empresa e um pipeline padrão por organização.

CNPJ, e-mail e telefone possuem índices para detecção de duplicidade, mas não constraints únicas. A
decisão evita bloquear cadastros legítimos e permite que o Bloco 3 apresente alertas ao usuário.

## Índices

Foram criados índices para:

- todas as chaves estrangeiras;
- filtros combinando organização, status, responsável e data;
- próximas ações, tarefas abertas e oportunidades abertas;
- nomes, e-mails, telefones e documentos usados na busca de duplicidades;
- timelines por entidade e data;
- notificações não lidas;
- vínculos de tags sem duplicação.

Índices parciais reduzem custo de escrita nos conjuntos consultados com maior frequência, como
tarefas abertas, notificações não lidas e registros opcionais não nulos.

## Segurança inicial

RLS está habilitado nas 19 tabelas públicas. `anon` e `authenticated` não possuem privilégios nessas
tabelas e nenhuma policy permissiva foi criada. O schema permanece fechado até que o Bloco 2 adicione
grants e policies específicas para cada operação e papel.

A função de manutenção de `updated_at` está no schema não exposto `private`, usa `security invoker`,
`search_path` vazio e não pode ser executada diretamente pelos papéis públicos.

## Tipos TypeScript

Os tipos ficam separados por domínio em `src/types/database`. `src/types/database.types.ts` compõe o
contrato utilizado pelo cliente Supabase. Quando uma instância local ou remota estiver disponível, o
arquivo composto deverá ser comparado com a saída oficial de `supabase gen types`.
