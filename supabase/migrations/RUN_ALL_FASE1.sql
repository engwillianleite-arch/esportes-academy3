-- =============================================================================
-- FASE 1 - ADMIN: Rodar tudo de uma vez no SQL Editor do Supabase
-- https://supabase.com/dashboard → seu projeto → SQL Editor → New query → colar e Run
-- =============================================================================

-- 01 - Perfis
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  avatar_url text,
  role_global text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can read all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role_global = 'admin')
);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email) values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'), new.email);
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
comment on table public.profiles is 'Perfis dos usuários (1:1 com auth.users). role_global = admin para admins da plataforma.';

-- 02 - Franqueadores
create table if not exists public.franchisors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  email text not null,
  phone text,
  document text,
  status text not null default 'pendente' check (status in ('ativo', 'pendente', 'suspenso')),
  notes_internal text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.franchisors enable row level security;
create policy "Admins can manage franchisors" on public.franchisors for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
);
comment on table public.franchisors is 'Franqueadores (redes). Status: ativo, pendente, suspenso.';

-- 03 - Escolas
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  franchisor_id uuid not null references public.franchisors(id) on delete restrict,
  name text not null,
  responsible_name text,
  email text,
  phone text,
  city text,
  state text,
  address text,
  status text not null default 'pendente' check (status in ('ativo', 'pendente', 'suspenso')),
  notes_internal text,
  org_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_schools_franchisor_id on public.schools(franchisor_id);
alter table public.schools enable row level security;
create policy "Admins can manage schools" on public.schools for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
);
comment on table public.schools is 'Escolas (franqueadas). Ligadas a um franchisor.';

-- 04 - Vínculo usuário-franqueador
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
create policy "Admins can manage franchisor_members" on public.franchisor_members for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
);
create policy "Users can read own franchisor_members" on public.franchisor_members for select using (user_id = auth.uid());
create policy "Franchisor members can read same franchisor" on public.franchisor_members for select using (
  exists (select 1 from public.franchisor_members fm2 where fm2.franchisor_id = franchisor_members.franchisor_id and fm2.user_id = auth.uid())
);
create policy "Franchisor members can read own franchisor" on public.franchisors for select using (
  exists (select 1 from public.franchisor_members fm where fm.franchisor_id = franchisors.id and fm.user_id = auth.uid())
);
comment on table public.franchisor_members is 'Vínculo usuário-franqueador. scope_type ALL_SCHOOLS = todas as escolas; SCHOOL_LIST = scope_school_ids.';

-- 05 - Vínculo usuário-escola
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
create policy "Admins can manage school_members" on public.school_members for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
);
create policy "Users can read own school_members" on public.school_members for select using (user_id = auth.uid());
create policy "School members can read same school" on public.school_members for select using (
  exists (select 1 from public.school_members sm2 where sm2.school_id = school_members.school_id and sm2.user_id = auth.uid())
);
create policy "School members can read own school" on public.schools for select using (
  exists (select 1 from public.school_members sm where sm.school_id = schools.id and sm.user_id = auth.uid())
);
comment on table public.school_members is 'Vínculo usuário-escola. scope_type SINGLE_SCHOOL = só esta escola; SCHOOL_LIST = scope_school_ids.';

-- 06 - Histórico status franqueador
create table if not exists public.franchisor_status_history (
  id uuid primary key default gen_random_uuid(),
  franchisor_id uuid not null references public.franchisors(id) on delete cascade,
  from_status text not null,
  to_status text not null,
  changed_at timestamptz default now(),
  actor_id uuid references auth.users(id) on delete set null,
  reason_category text,
  reason_details text
);
create index if not exists idx_franchisor_status_history_franchisor on public.franchisor_status_history(franchisor_id);
alter table public.franchisor_status_history enable row level security;
create policy "Admins can manage franchisor_status_history" on public.franchisor_status_history for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
);
create policy "Franchisor members can read own history" on public.franchisor_status_history for select using (
  exists (select 1 from public.franchisor_members fm where fm.franchisor_id = franchisor_status_history.franchisor_id and fm.user_id = auth.uid())
);
comment on table public.franchisor_status_history is 'Histórico de alterações de status do franqueador (pendente->ativo, ativo->suspenso, etc).';

-- 07 - Histórico status escola
create table if not exists public.school_status_history (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  from_status text not null,
  to_status text not null,
  changed_at timestamptz default now(),
  actor_id uuid references auth.users(id) on delete set null,
  reason_category text,
  reason_details text
);
create index if not exists idx_school_status_history_school on public.school_status_history(school_id);
alter table public.school_status_history enable row level security;
create policy "Admins can manage school_status_history" on public.school_status_history for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
);
create policy "School members can read own school history" on public.school_status_history for select using (
  exists (select 1 from public.school_members sm where sm.school_id = school_status_history.school_id and sm.user_id = auth.uid())
);
comment on table public.school_status_history is 'Histórico de alterações de status da escola (ativo->suspenso, etc).';
