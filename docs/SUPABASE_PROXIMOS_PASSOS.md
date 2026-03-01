# Supabase – Próximos passos (fase a fase)

Este guia orienta o que fazer em cada fase para conectar o frontend ao Supabase.

---

## Antes de começar (configuração única)

1. **Crie um projeto no Supabase** (se ainda não tiver):
   - Acesse [supabase.com](https://supabase.com) e crie um projeto.
   - Anote o **Project ID** (em Settings > General) e a **URL** e **anon key** (Settings > API).

2. **Configure as variáveis de ambiente no seu projeto:**
   - Copie `.env.example` para `.env`.
   - Preencha no `.env`:
     - `VITE_SUPABASE_URL` = URL do projeto (ex.: `https://xxxx.supabase.co`)
     - `VITE_SUPABASE_ANON_KEY` = chave anon (public) do projeto.

3. **Reinicie o servidor de desenvolvimento** (`npm run dev`) após alterar o `.env`.

---

## Fase 1: Admin (banco + auth)

### Passo 1.1 – Aplicar as migrations no Supabase

As tabelas da Fase 1 estão em `supabase/migrations/` na ordem:

| Ordem | Arquivo | Descrição |
|-------|---------|-----------|
| 1 | `01_create_profiles.sql` | Perfis (profiles) + trigger de sign up |
| 2 | `02_create_franchisors.sql` | Franqueadores |
| 3 | `03_create_schools.sql` | Escolas |
| 4 | `04_create_franchisor_members.sql` | Vínculo usuário–franqueador + policy em franchisors |
| 5 | `05_create_school_members.sql` | Vínculo usuário–escola + policy em schools |
| 6 | `06_create_franchisor_status_history.sql` | Histórico de status do franqueador |
| 7 | `07_create_school_status_history.sql` | Histórico de status da escola |
| 8 | `08_create_audit_logs.sql` | Auditoria do portal Admin (eventos de criação de escola, alteração de status, etc.) |

**Como aplicar:**

- **Opção A – Painel do Supabase:**  
  Abra o **SQL Editor** do projeto e execute cada arquivo **nessa ordem**, um por vez.

- **Opção B – MCP (Cursor):**  
  Use a ferramenta `apply_migration` do MCP Supabase com:
  - `project_id`: ID do seu projeto Supabase
  - `name`: nome em snake_case (ex.: `create_profiles`, `create_franchisors`, …)
  - `query`: conteúdo do arquivo `.sql` correspondente

Depois de rodar as 8 migrations, confira em **Table Editor** se as tabelas existem: `profiles`, `franchisors`, `schools`, `franchisor_members`, `school_members`, `franchisor_status_history`, `school_status_history`, `audit_logs`.

### Passo 1.2 – Criar as contas demo (Admin, Franqueador, Franqueado)

**Opção A – Script automático (recomendado)**

1. No `.env`, adicione a **service role key** do Supabase (nunca use no frontend):
   - Dashboard → **Settings** → **API** → copie a chave **service_role** (secret).
   - No `.env`: `SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key`
2. No terminal, na raiz do projeto:
   ```bash
   npm run seed:demo
   ```
   Isso cria os 3 usuários (admin@demo.com, franqueador@demo.com, franqueado@demo.com, senha `demo123`) e configura os acessos de cada perfil.

**Opção B – Criar apenas o primeiro admin manualmente**

1. No Supabase: **Authentication > Users > Add user** (ou use Sign Up do seu app).
2. Crie um usuário com e-mail e senha.
3. No **SQL Editor**, execute (troque `SEU_EMAIL@exemplo.com` pelo e-mail do usuário):

```sql
update public.profiles
set role_global = 'admin'
where email = 'SEU_EMAIL@exemplo.com';
```

Se o perfil ainda não existir (sign up foi manual), insira:

```sql
insert into public.profiles (id, name, email, role_global)
select id, raw_user_meta_data->>'name', email, 'admin'
from auth.users
where email = 'SEU_EMAIL@exemplo.com';
```

### Passo 1.3 – Integrar login do frontend com Supabase Auth

Próximo passo de implementação no código:

- Trocar a lógica de login em `src/api/auth.js` (e onde o login é chamado) para usar `supabase.auth.signInWithPassword({ email, password })`.
- Após login bem-sucedido, buscar o perfil em `public.profiles` (e, se precisar, `franchisor_members` / `school_members`) para montar `user` e `memberships` e preencher o contexto de auth (ex.: `AuthContext`).
- A tela “Escolha como deseja acessar” (Select Access) deve usar os dados de `profiles` + `franchisor_members` + `school_members` para listar os portais (Admin, Franqueador, Escola) e contextos (escola/franqueador).

Quando isso estiver feito, a Fase 1 (Admin) estará “conectada” no que diz respeito a auth e estrutura de dados. ### Passo 1.4 – Portal Admin conectado ao Supabase

O frontend do portal Admin já está integrado ao Supabase quando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão no `.env`: franqueadores, escolas, usuários (franqueador/escola), alteração de status e auditoria (`audit_logs`). Se o Supabase não estiver configurado, o app usa os mocks em memória.

---

## Fase 2: Franqueador

- Garantir que o usuário franqueador veja apenas suas escolas (já coberto pelas RLS nas tabelas `franchisors`, `schools`, `franchisor_members`).
- Substituir os mocks de `src/api/franchisorPortal.js` por chamadas ao Supabase (ou a uma API que use o Supabase).
- Se houver entidade “campanhas” persistida no banco, criar as tabelas (ex.: `campaigns`, `campaign_target_schools`) e RLS na Fase 2 e conectar o frontend.

---

## Fase 3: Franqueado (Escola)

- Criar as migrations para: `students`, `teams`, `team_students`, `school_settings`, `school_preferences`, `invoices`, `attendances` (conforme planejado).
- Aplicar as migrations no Supabase.
- Substituir os mocks de `src/api/schoolPortal.js` e de `src/data/mockSchoolSession.js` por dados reais do Supabase; sessão da escola derivada de `school_members` e do contexto escolhido na tela de Select Access.

---

## Resumo do que já foi criado no projeto

- `src/lib/supabase.js` – Cliente Supabase (usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
- `.env.example` – Modelo de variáveis de ambiente.
- `supabase/migrations/01 a 08` – SQL da Fase 1 (Admin), incluindo `audit_logs`.
- `src/api/supabaseAdmin.js` – Implementação das APIs do admin com Supabase.
- `src/api/audit.js` – Helper para registrar eventos de auditoria.
- Este guia: `docs/SUPABASE_PROXIMOS_PASSOS.md`.

**Próxima ação recomendada:** configurar o `.env`, aplicar as 8 migrations no Supabase e criar o primeiro admin (Passos 1.1 e 1.2). Depois partir para o Passo 1.3 (login + Select Access com Supabase). O portal Admin já usa o banco quando o Supabase está configurado (Passo 1.4).
