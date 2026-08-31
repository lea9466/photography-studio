-- Vercel's domain `verified` flag (already driving status='active' — see
-- statusFromVerification in lib/actions/custom-domain.actions.ts) mainly
-- reflects "no ownership conflict", NOT "DNS is actually pointing at Vercel
-- right now" — confirmed live via GET /v6/domains/{domain}/config, which can
-- report `misconfigured: true` (no CNAME/A record found at all) on a domain
-- that's already 'active' by our own status. Without this, the dashboard
-- showed a plain green "connected" box the moment Vercel accepted the
-- attach — before the photographer had necessarily added any DNS record at
-- all — which a real customer read as "done", never added the record, and
-- Search Console verification then failed with a genuine NXDOMAIN.
-- dns_live is that separate, honest signal: true only once Vercel's config
-- check confirms the record is actually there. Defaults false (a brand new
-- domain has no DNS yet); flips to true once lib/actions/custom-domain.actions.ts's
-- checkCustomDomainStatus confirms it, same place status is already updated.
alter table public.custom_domains
  add column if not exists dns_live boolean not null default false;

comment on column public.custom_domains.dns_live is
  'True only once Vercel confirms DNS is actually configured (GET /v6/domains/{domain}/config, misconfigured=false) — independent of status=''active'', which only means Vercel accepted the attach with no ownership conflict.';
