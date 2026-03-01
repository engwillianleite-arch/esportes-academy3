-- Fase 1 - Admin: Vínculo usuário <-> escola (RBAC)
-- Execute após 04_create_franchisor_members. Nome MCP: create_school_members.

create table if not exists public.school_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role text not null check (role in ('SchoolOwner', 'SchoolStaff', 'Coach', 'Finance')),
  scope_type text not null default 'SINGLE_SCHOOL' check (scope_type in ('SINGLE_SCHOOL', 'SCHOOL_LIST')),
  scope_school_ids uuid[] default null,
  status text not null default 'convidado' check (status in ('ativo', 'convidado')),
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, school_id)
);

create index if not exists idx_school_members_user on public.school_members(user_id);
create index if not exists idx_school_members_school on public.school_members(school_id);

alter table public.school_members enable row level security;

-- Admins podem gerenciar todos
create policy "Admins can manage school_members"
  on public.school_members for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
  );

-- Usuário vê apenas seus próprios vínculos
create policy "Users can read own school_members"
  on public.school_members for select
  using (user_id = auth.uid());

-- Membro de uma escola pode ler outros membros da mesma escola (para gestão)
create policy "School members can read same school"
  on public.school_members for select
  using (
    exists (
      select 1 from public.school_members sm2
      where sm2.school_id = school_members.school_id and sm2.user_id = auth.uid()
    )
  );

-- Escola: membros podem ler dados da própria escola
create policy "School members can read own school"
  on public.schools for select
  using (
    exists (
      select 1 from public.school_members sm
      where sm.school_id = schools.id and sm.user_id = auth.uid()
    )
  );

comment on table public.school_members is 'Vínculo usuário-escola. scope_type SINGLE_SCHOOL = só esta escola; SCHOOL_LIST = scope_school_ids.';
