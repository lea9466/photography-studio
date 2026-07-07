-- Security hardening: tighten public RLS and revoke anon access to sensitive tables.
-- Public pages should read gallery/testimonial data via server-side service role only.

-- ---------------------------------------------------------------------------
-- galleries — remove public anon read (exposed password column via SELECT *)
-- ---------------------------------------------------------------------------
drop policy if exists "galleries_select_portfolio_public" on public.galleries;

revoke select on table public.galleries from anon;

-- ---------------------------------------------------------------------------
-- photos — anon SELECT was granted but no public policy existed; revoke anyway
-- ---------------------------------------------------------------------------
revoke select on table public.photos from anon;

-- ---------------------------------------------------------------------------
-- testimonials — remove cross-tenant public read (USING true)
-- ---------------------------------------------------------------------------
drop policy if exists "testimonials_select_public" on public.testimonials;

revoke select on table public.testimonials from anon;
