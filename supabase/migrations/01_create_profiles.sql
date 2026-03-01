-- Fase 1 - Admin: Perfis de usuário (1:1 com auth.users)
-- Execute no SQL Editor do Supabase ou via MCP apply_migration (name: create_profiles).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  avatar_url text,
  role_global text default null,  -- 'admin' = admin da plataforma
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Usuário só vê e atualiza o próprio perfil
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin vê todos (quando role_global = 'admin')
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.role_global = 'admin'
    )
  );

-- Trigger: criar perfil ao registrar usuário (sign up)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on table public.profiles is 'Perfis dos usuários (1:1 com auth.users). role_global = admin para admins da plataforma.';
