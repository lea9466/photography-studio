-- Studio Gallery — provider-neutral payment and subscription infrastructure
-- Prepared only. Apply in a local/sandbox environment before production.
-- This is a one-time Supabase migration. An accidental manual rerun fails on
-- CREATE TABLE and rolls back atomically rather than hiding schema drift.

begin;

-- ---------------------------------------------------------------------------
-- Billing customers
-- ---------------------------------------------------------------------------
create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null
    check (provider in ('payme', 'grow', 'stripe', 'tranzila')),
  provider_customer_id text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create unique index billing_customers_provider_customer_unique
  on public.billing_customers (provider, provider_customer_id)
  where provider_customer_id is not null;

-- ---------------------------------------------------------------------------
-- Subscription plan catalog
-- ---------------------------------------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  description text,
  amount_agorot integer not null check (amount_agorot > 0),
  currency text not null default 'ILS'
    check (currency = upper(currency) and length(currency) = 3),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  is_active boolean not null default true,
  provider text
    check (provider is null or provider in ('payme', 'grow', 'stripe', 'tranzila')),
  provider_plan_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscription_plans_provider_plan_unique
  on public.subscription_plans (provider, provider_plan_id)
  where provider is not null and provider_plan_id is not null;

insert into public.subscription_plans (
  code,
  name,
  description,
  amount_agorot,
  currency,
  billing_interval,
  is_active
)
values (
  'studio_monthly',
  'מנוי חודשי',
  'מנוי חודשי ל-Studio Gallery',
  4000,
  'ILS',
  'month',
  true
)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  billing_customer_id uuid references public.billing_customers (id) on delete set null,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  provider text not null
    check (provider in ('payme', 'grow', 'stripe', 'tranzila')),
  provider_subscription_id text,
  status text not null default 'pending'
    check (status in (
      'pending',
      'active',
      'past_due',
      'payment_failed',
      'cancelled',
      'expired',
      'paused'
    )),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  last_payment_at timestamptz,
  next_payment_at timestamptz,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_provider_subscription_id_idx
  on public.subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;
create unique index subscriptions_provider_subscription_unique
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_next_payment_at_idx
  on public.subscriptions (next_payment_at)
  where next_payment_at is not null;

-- ---------------------------------------------------------------------------
-- Payment transactions
-- ---------------------------------------------------------------------------
create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  provider text not null
    check (provider in ('payme', 'grow', 'stripe', 'tranzila')),
  provider_transaction_id text,
  status text not null
    check (status in (
      'pending',
      'succeeded',
      'failed',
      'refunded',
      'partially_refunded',
      'disputed',
      'cancelled'
    )),
  amount_agorot integer not null check (amount_agorot >= 0),
  currency text not null default 'ILS'
    check (currency = upper(currency) and length(currency) = 3),
  failure_code text,
  failure_message text,
  paid_at timestamptz,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_transactions_user_id_idx
  on public.payment_transactions (user_id);
create index payment_transactions_subscription_id_idx
  on public.payment_transactions (subscription_id);
create index payment_transactions_status_idx
  on public.payment_transactions (status);
create unique index payment_transactions_provider_transaction_unique
  on public.payment_transactions (provider, provider_transaction_id)
  where provider_transaction_id is not null;

-- ---------------------------------------------------------------------------
-- Webhook inbox
-- ---------------------------------------------------------------------------
create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null
    check (provider in ('payme', 'grow', 'stripe', 'tranzila')),
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'processed', 'ignored', 'failed')),
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create index payment_webhook_events_processing_idx
  on public.payment_webhook_events (processing_status, received_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
-- public.set_updated_at() already exists and is used by earlier migrations.
-- Do not replace it here: changing it could affect unrelated tables.

create trigger billing_customers_set_updated_at
  before update on public.billing_customers
  for each row execute function public.set_updated_at();

create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger payment_transactions_set_updated_at
  before update on public.payment_transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic webhook claim
-- The unique inbox row prevents duplicate processing. Failed events may be
-- claimed again; processed/ignored/processing events are never reclaimed.
-- ---------------------------------------------------------------------------
create function public.claim_payment_webhook_event(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_payload jsonb
)
returns table (
  webhook_event_id uuid,
  claimed boolean,
  current_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_status text;
begin
  insert into public.payment_webhook_events (
    provider,
    provider_event_id,
    event_type,
    payload
  )
  values (
    p_provider,
    p_provider_event_id,
    p_event_type,
    p_payload
  )
  on conflict (provider, provider_event_id) do nothing;

  update public.payment_webhook_events
  set
    processing_status = 'processing',
    processing_error = null,
    processed_at = null
  where provider = p_provider
    and provider_event_id = p_provider_event_id
    and processing_status in ('pending', 'failed')
  returning id, processing_status
  into v_event_id, v_status;

  if v_event_id is not null then
    return query select v_event_id, true, v_status;
    return;
  end if;

  select id, processing_status
  into v_event_id, v_status
  from public.payment_webhook_events
  where provider = p_provider
    and provider_event_id = p_provider_event_id;

  return query select v_event_id, false, v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.billing_customers enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy "billing_customers_select_own"
  on public.billing_customers for select
  to authenticated
  using (user_id = auth.uid());

create policy "subscription_plans_select_active"
  on public.subscription_plans for select
  to authenticated
  using (is_active = true);

create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid());

create policy "payment_transactions_select_own"
  on public.payment_transactions for select
  to authenticated
  using (user_id = auth.uid());

-- Default privileges in this project are broad, so payment grants are reset
-- explicitly. No client role receives INSERT/UPDATE/DELETE on billing data.
revoke all on table public.billing_customers from anon, authenticated;
revoke all on table public.subscription_plans from anon, authenticated;
revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.payment_transactions from anon, authenticated;
revoke all on table public.payment_webhook_events from anon, authenticated;

grant select on table public.subscription_plans to authenticated;

grant select (
  id,
  user_id,
  provider,
  email,
  created_at,
  updated_at
) on public.billing_customers to authenticated;

grant select (
  id,
  user_id,
  plan_id,
  provider,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  cancelled_at,
  last_payment_at,
  next_payment_at,
  created_at,
  updated_at
) on public.subscriptions to authenticated;

grant select (
  id,
  user_id,
  subscription_id,
  provider,
  status,
  amount_agorot,
  currency,
  paid_at,
  created_at,
  updated_at
) on public.payment_transactions to authenticated;

revoke all on function public.claim_payment_webhook_event(text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.claim_payment_webhook_event(text, text, text, jsonb)
  to service_role;

comment on table public.billing_customers is
  'Provider-neutral customer identifiers. Never stores card details.';
comment on table public.subscription_plans is
  'Server-authoritative SaaS plan catalog; amounts are stored in agorot.';
comment on table public.subscriptions is
  'Local subscription state used for fast entitlement checks.';
comment on table public.payment_transactions is
  'Provider-neutral payment ledger without cardholder data.';
comment on table public.payment_webhook_events is
  'Private verified webhook inbox and idempotency log.';

commit;
