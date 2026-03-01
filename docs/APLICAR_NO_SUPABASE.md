# Aplicar as regras (migrations) direto no Supabase

As regras do banco (tabelas, RLS, triggers) estão em um único arquivo para você rodar no **SQL Editor** do seu projeto Supabase.

## Opção 1: Um único script (recomendado)

1. Abra o arquivo **`supabase/migrations/RUN_ALL_COM_AUDIT.sql`** (na raiz do projeto).
2. Selecione todo o conteúdo e copie (Ctrl+A, Ctrl+C).
3. Acesse [Supabase Dashboard](https://supabase.com/dashboard) → escolha seu projeto.
4. No menu lateral: **SQL Editor** → **New query**.
5. Cole o SQL (Ctrl+V) e clique em **Run** (ou Ctrl+Enter).

Pronto. Isso cria (ou garante que existam) as tabelas e políticas:

- `profiles`, `franchisors`, `schools`
- `franchisor_members`, `school_members`
- `franchisor_status_history`, `school_status_history`
- `audit_logs`

Se alguma tabela ou policy já existir, o script usa `create table if not exists` e evita conflito onde for possível. Se der erro em alguma policy (por exemplo, nome duplicado), você pode comentar só aquela linha e rodar de novo.

---

## Opção 2: Via MCP no Cursor (para o agente aplicar por você)

Para o agente aplicar as migrations **por você** no Supabase, o Cursor precisa “enxergar” seu projeto:

1. Conecte sua conta Supabase ao Cursor: **Settings** → **MCP** → servidor **Supabase** → fazer login/vinculação se pedido.
2. Depois disso, peça no chat: *“Aplique as migrations no meu projeto Supabase”* (ou algo como *“apply migrations to Supabase”*).  
   O agente usará o MCP para listar seus projetos e aplicar as migrations no projeto que você estiver usando.

Se **list_projects** do MCP retornar vazio, a conta ainda não está vinculada ou não há projetos; use a **Opção 1** (SQL Editor) acima.

---

## Opção 3: Supabase CLI

Se você usa a CLI do Supabase e já fez `supabase link` no projeto:

```bash
npx supabase db push
```

Isso aplica os arquivos em `supabase/migrations/` (01 a 08) na ordem. O arquivo `RUN_ALL_COM_AUDIT.sql` é só para rodar manualmente no SQL Editor; o `db push` usa os arquivos numerados.
