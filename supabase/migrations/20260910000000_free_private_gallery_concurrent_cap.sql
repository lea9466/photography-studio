-- Client-gallery lifecycle, phase 3 (docs/private-gallery-lifecycle-plan.md §1.ד):
-- the free private-gallery tier moves from a LIFETIME 1-gallery cap
-- (users.free_private_gallery_created, never cleared on delete) to a CONCURRENT
-- 1-gallery cap — the same shape as the paid tiers. Deleting the gallery
-- (manually, or via the 60-day auto-delete) now reopens the slot.
--
-- max_galleries (1) and max_photos_per_gallery (400) are already set on the
-- free row; is_lifetime_cap is the whole switch — the app already routes a
-- non-lifetime tier through the concurrent-count path.
--
-- users.free_private_gallery_created is left in place (no longer read or
-- written by app code) so the column can be inspected / dropped later.

update public.private_gallery_tiers
  set is_lifetime_cap = false
  where tier = 'free';
