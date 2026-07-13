-- Security hygiene (belt-and-suspenders): revoke table-level grants that are
-- currently unreachable due to RLS, but would become live exposures the
-- moment someone adds a permissive policy without re-checking grants.
--
-- Neither table below is ever queried with the anon/browser key in app code —
-- both are read/written exclusively through the service-role admin client
-- (lib/referral/slug-redirect.ts, lib/actions/feedback.actions.ts) — so the
-- default-privilege grants from 20250614000005_grants.sql that anon still
-- holds serve no purpose today.

-- ---------------------------------------------------------------------------
-- slug_redirects — RLS is enabled with zero policies (deny-all already),
-- but anon still holds SELECT/INSERT and authenticated holds ALL via the
-- project's default privileges. Revoke explicitly so RLS is not the only
-- line of defense.
-- ---------------------------------------------------------------------------
revoke all on table public.slug_redirects from anon, authenticated;

-- ---------------------------------------------------------------------------
-- feedback — has a permissive anon/public INSERT policy
-- ("feedback_insert_public", with_check true) plus a stray anon SELECT
-- grant with no matching SELECT policy (already blocked by RLS), and
-- authenticated holds ALL via the default privileges.
--
-- Verified in code that submitFeedback() (lib/actions/feedback.actions.ts)
-- is the single write path for BOTH callers:
--   - components/marketing/ContactForm.tsx      (anonymous public visitor)
--   - components/dashboard/DashboardContactForm.tsx (logged-in studio owner)
-- submitFeedback() has no auth gate and always writes via
-- createAdminClient() (service-role) from the server action — neither
-- caller ever touches this table with the browser's anon key or the
-- authenticated user's JWT/session directly. So there is no legitimate
-- direct-table-access path for anon OR authenticated; revoke both,
-- consistent with slug_redirects. service_role (BYPASSRLS) is unaffected.
-- The "feedback_insert_public" policy is left in place as documentation of
-- intent but is now unreachable without the grant; drop it too if you want
-- a single source of truth.
-- ---------------------------------------------------------------------------
revoke all on table public.feedback from anon, authenticated;
