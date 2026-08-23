-- Custom domains — lets a photographer point their own domain (e.g.
-- johnphoto.com) at their studio site, proxied through Cloudflare for SaaS
-- (Custom Hostnames) and attached to the Vercel project so both edges
-- recognize the hostname. See lib/cloudflare/*, lib/vercel/*,
-- lib/actions/custom-domain.actions.ts, and the host lookup in
-- lib/supabase/middleware.ts.

begin;

create table public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  hostname text not null check (hostname = lower(hostname)),
  status text not null default 'pending'
    check (status in ('pending', 'pending_dns', 'active', 'error', 'deleted')),
  cloudflare_hostname_id text,
  cloudflare_ownership_verification jsonb,
  cloudflare_ssl_status text,
  vercel_attached boolean not null default false,
  vercel_verification jsonb,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partial (not plain) unique index: disconnecting soft-deletes a row
-- (status='deleted', kept for audit) rather than hard-deleting it, so the
-- same hostname must remain connectable again afterwards.
create unique index custom_domains_hostname_active_idx
  on public.custom_domains (hostname) where status <> 'deleted';

create index custom_domains_user_id_idx on public.custom_domains (user_id);

comment on table public.custom_domains is
  'Photographer-owned custom domains proxied through Cloudflare for SaaS and mapped via user_id to a studio slug at the edge.';
comment on column public.custom_domains.status is
  'pending: row created, Cloudflare/Vercel calls in flight. pending_dns: Cloudflare hostname created, waiting on customer DNS + SSL validation. active: verified and serving. error: a Cloudflare/Vercel step failed, see last_error. deleted: soft-deleted after disconnect.';

alter table public.custom_domains enable row level security;

-- Read-only for the owner. Deliberately NO insert/update/delete policy for
-- authenticated users: status, cloudflare_ownership_verification and
-- vercel_attached are only ever meant to be set after this server has
-- actually confirmed them with Cloudflare/Vercel (see
-- lib/actions/custom-domain.actions.ts). An "own row" write policy checking
-- only user_id = auth.uid() would let a signed-in user call the Supabase
-- client directly and set status='active' (or claim any hostname) without
-- ever passing real verification — the middleware host lookup would then
-- trust it. All writes go through the service-role client instead.
create policy "custom_domains_select_own" on public.custom_domains
  for select using (user_id = auth.uid());

commit;
