-- Fase 1 - Admin: Escolas (pertencem a um franqueador)
-- Execute após 02_create_franchisors. Nome MCP: create_schools.

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

-- Admins podem tudo
create policy "Admins can manage schools"
  on public.schools for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role_global = 'admin'
    )
  );

-- Franqueador vê escolas do seu franchisor_id (policy adicionada em 04)
-- Escola vê só a própria escola (policy adicionada em 05)

comment on table public.schools is 'Escolas (franqueadas). Ligadas a um franchisor.';
