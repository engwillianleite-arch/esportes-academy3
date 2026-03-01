-- Fase 1 - Admin: Franqueadores
-- Execute após 01_create_profiles. Nome sugerido para MCP: create_franchisors.

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

-- Apenas admins podem ver/inserir/atualizar/deletar franqueadores
create policy "Admins can manage franchisors"
  on public.franchisors for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role_global = 'admin'
    )
  );

-- Policy "Franchisor members can read own franchisor" é criada em 04_create_franchisor_members.sql

comment on table public.franchisors is 'Franqueadores (redes). Status: ativo, pendente, suspenso.';
