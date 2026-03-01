-- Fase 1 - Admin: Histórico de status do franqueador
-- Execute após 04. Nome MCP: create_franchisor_status_history.

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

create policy "Admins can manage franchisor_status_history"
  on public.franchisor_status_history for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
  );

create policy "Franchisor members can read own history"
  on public.franchisor_status_history for select
  using (
    exists (
      select 1 from public.franchisor_members fm
      where fm.franchisor_id = franchisor_status_history.franchisor_id and fm.user_id = auth.uid()
    )
  );

comment on table public.franchisor_status_history is 'Histórico de alterações de status do franqueador (pendente->ativo, ativo->suspenso, etc).';
