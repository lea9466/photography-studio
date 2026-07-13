-- Security hardening: remove cross-tenant anon read on photography_packages.
--
-- Audit finding (RLS review, 2026-07-13): "packages_select_public" lets the
-- `anon` role SELECT *any* studio's active packages as long as that studio
-- has at least one gallery with gallery_type = 'portfolio'. The policy does
-- NOT scope by slug/studio, so a single anon PostgREST query
-- (`select * from photography_packages where is_active = true`) enumerates
-- every studio's pricing/package names platform-wide, not just the one
-- being viewed on a given public page.
--
-- Verified in app code (lib/queries/public-photographer.ts, app/[slug]/page.tsx)
-- that the public homepage/portfolio pages already read packages exclusively
-- through the service-role admin client (createAdminClient()), scoped to the
-- single photographer resolved from the slug. There is no legitimate
-- anon-key/browser code path that relies on this policy — same pattern
-- already applied to galleries/photos/testimonials/posts in
-- 20250708000004_security_rls_hardening.sql. Safe to drop.

drop policy if exists "packages_select_public" on public.photography_packages;

revoke all on table public.photography_packages from anon;
