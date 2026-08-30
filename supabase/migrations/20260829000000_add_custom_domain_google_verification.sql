-- Manual (admin-entered) Google Search Console verification, per custom
-- domain. Full API-driven automation (Site Verification API + Search
-- Console API via a service account/OAuth) was attempted and abandoned —
-- the Google Cloud org this project sits under enforces default
-- restrictions (service account key creation disabled, and a separate
-- OAuth access_denied wall not resolvable without Workspace super-admin
-- access neither available here) that made it impractical. Instead: the
-- admin (see /manage) verifies each connected domain in Search Console
-- herself using the "HTML tag" method (not DNS — the photographer's own
-- domain access is never needed either way), pastes the resulting token in,
-- and this column is what makes it show up in that domain's pages via
-- Next's built-in `verification.google` metadata field.
alter table public.custom_domains
  add column if not exists google_site_verification_token text;

comment on column public.custom_domains.google_site_verification_token is
  'Token from Search Console''s "HTML tag" verification method for this domain, entered manually by the admin in /manage. Rendered as <meta name="google-site-verification"> on every page served under this domain.';
