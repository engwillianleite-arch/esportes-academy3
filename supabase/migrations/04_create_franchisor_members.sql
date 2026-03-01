-- Fase 1 - Admin: Vínculo usuário <-> franqueador (RBAC)
-- Execute após 03_create_schools. Nome MCP: create_franchisor_members.

create table if not exists public.franchisor_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  franchisor_id uuid not null references public.franchisors(id) on delete cascade,
  role text not null check (role in ('FranchisorOwner', 'FranchisorStaff')),
  scope_type text not null default 'ALL_SCHOOLS' check (scope_type in ('ALL_SCHOOLS', 'SCHOOL_LIST')),
  scope_school_ids uuid[] default null,
  status text not null default 'convidado' check (status in ('ativo', 'convidado')),
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, franchisor_id)
);

create index if not exists idx_franchisor_members_user on public.franchisor_members(user_id);
create index if not exists idx_franchisor_members_franchisor on public.franchisor_members(franchisor_id);

alter table public.franchisor_members enable row level security;

-- Admins podem gerenciar todos
create policy "Admins can manage franchisor_members"
  on public.franchisor_members for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
  );

-- Membro vê apenas seus próprios vínculos
create policy "Users can read own franchisor_members"
  on public.franchisor_members for select
  using (user_id = auth.uid());

-- Franqueador pode ler membros do próprio franqueador (Owner/Staff)
create policy "Franchisor members can read same franchisor"
  on public.franchisor_members for select
  using (
    exists (
      select 1 from public.franchisor_members fm2
      where fm2.franchisor_id = franchisor_members.franchisor_id and fm2.user_id = auth.uid()
    )
  );

-- Permitir que franqueadores leiam a tabela franchisors (para /franchisor/me)
create policy "Franchisor members can read own franchisor"
  on public.franchisors for select
  using (
    exists (
      select 1 from public.franchisor_members fm
      where fm.franchisor_id = franchisors.id and fm.user_id = auth.uid()
    )
  );

comment on table public.franchisor_members is 'Vínculo usuário-franqueador. scope_type ALL_SCHOOLS = todas as escolas; SCHOOL_LIST = scope_school_ids.';
