-- Fase 1 - Admin: Histórico de status da escola
-- Execute após 05. Nome MCP: create_school_status_history.

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

create policy "Admins can manage school_status_history"
  on public.school_status_history for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
  );

create policy "School members can read own school history"
  on public.school_status_history for select
  using (
    exists (
      select 1 from public.school_members sm
      where sm.school_id = school_status_history.school_id and sm.user_id = auth.uid()
    )
  );

comment on table public.school_status_history is 'Histórico de alterações de status da escola (ativo->suspenso, etc).';
