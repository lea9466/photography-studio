-- Standalone one-time ₪99 purchase that unlocks custom_domain independently
-- of subscription tier (see lib/subscriptions/entitlements.ts's buildFeatures)
-- — a studio that's FREE, mid-trial, or downgraded keeps this if she paid for
-- it separately. Null = never purchased. Set once, never cleared back to null
-- (a real purchase isn't retroactively revoked).
alter table public.users
  add column if not exists custom_domain_addon_purchased_at timestamptz;

comment on column public.users.custom_domain_addon_purchased_at is
  'When the standalone one-time custom-domain addon (₪99) was purchased. Independent of subscription tier — see lib/subscriptions/entitlements.ts.';

-- 'suspended_billing': the domain was verified and working, but the owner no
-- longer has current access (no active subscription/admin override AND no
-- addon purchase) — see lib/domains/rewrite.ts. Visitors are redirected to
-- the studio-galleries.com/{slug} URL instead of a broken page; reactivating
-- (resubscribing or buying the addon) flips this back to 'active'. Distinct
-- from 'error' (a real connection/DNS failure) and 'deleted' (disconnected).
alter table public.custom_domains
  drop constraint if exists custom_domains_status_check;

alter table public.custom_domains
  add constraint custom_domains_status_check
    check (status in ('pending', 'pending_dns', 'active', 'suspended_billing', 'error', 'deleted'));
