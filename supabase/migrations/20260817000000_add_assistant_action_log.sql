-- Dashboard Assistant (AI bot) — action log used for the preview/confirm/undo
-- flow described in the assistant spec. Every write the assistant performs is
-- first approved explicitly by the photographer; once approved, the actual
-- write goes through the existing Server Action (e.g. updateProfile) and a
-- row is recorded here with the pre-change snapshot so it can be undone
-- within a short window.

begin;

create table public.assistant_action_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  action_type text not null,
  payload jsonb not null,
  previous_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  undone_at timestamptz
);

create index assistant_action_log_user_id_idx on public.assistant_action_log (user_id, created_at desc);

comment on table public.assistant_action_log is
  'Audit log + undo snapshots for writes performed via the dashboard AI assistant.';

alter table public.assistant_action_log enable row level security;

create policy "assistant_action_log_select_own" on public.assistant_action_log
  for select using (user_id = auth.uid());

create policy "assistant_action_log_insert_own" on public.assistant_action_log
  for insert with check (user_id = auth.uid());

create policy "assistant_action_log_update_own" on public.assistant_action_log
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;
