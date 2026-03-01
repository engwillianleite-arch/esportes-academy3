-- =============================================================================
-- FASE 1 - Auditoria do portal Admin
-- Tabela para eventos de auditoria (criação de escola, alteração de status, etc.)
-- =============================================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text,
  actor_email text,
  event_type text not null,
  entity_type text,
  entity_id text,
  school_id uuid references public.schools(id) on delete set null,
  franchisor_id uuid references public.franchisors(id) on delete set null,
  ip_address text,
  metadata_summary text,
  user_agent text,
  source_portal text,
  metadata jsonb default '{}',
  correlation_id text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_occurred_at on public.audit_logs(occurred_at desc);
create index if not exists idx_audit_logs_actor_user_id on public.audit_logs(actor_user_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_school_id on public.audit_logs(school_id);
create index if not exists idx_audit_logs_franchisor_id on public.audit_logs(franchisor_id);
create index if not exists idx_audit_logs_event_type on public.audit_logs(event_type);

alter table public.audit_logs enable row level security;

create policy "Admins can manage audit_logs"
  on public.audit_logs for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role_global = 'admin')
  );

comment on table public.audit_logs is 'Eventos de auditoria do portal Admin (criação de escola, alteração de status, etc.).';
