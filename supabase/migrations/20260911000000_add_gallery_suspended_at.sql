-- Client-gallery lifecycle, phase 4 (docs/private-gallery-lifecycle-plan.md §1.ה):
-- when a studio's private-gallery subscription lapses, then stays unrenewed
-- past a 15-day grace, ALL her client galleries are suspended — the client AND
-- the photographer are blocked from the content until she renews. Renewing a
-- private-gallery subscription clears it synchronously (reactivateSuspended-
-- ClientGalleries); a daily sweep is the safety net for the lapse direction
-- (suspendClientGalleriesWithLapsedSubscription), mirroring custom domains.
--
-- The 60-day auto-deletion clock (expires_at) runs independently — a suspended
-- gallery still gets deleted on its own schedule.

alter table public.galleries
  add column suspended_at timestamptz;

comment on column public.galleries.suspended_at is
  'Set when a client gallery is frozen because its owner''s private-gallery subscription lapsed (past the 15-day grace). Cleared on renewal. See lib/private-galleries/gallery-suspension.ts.';

create index if not exists galleries_suspended_idx
  on public.galleries (user_id)
  where gallery_type = 'selection' and suspended_at is not null;
