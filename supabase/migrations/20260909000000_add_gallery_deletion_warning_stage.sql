-- Client-gallery lifecycle, phase 2 (docs/private-gallery-lifecycle-plan.md):
-- a sent client gallery lives 60 days from send (expires_at, defaulted by
-- sendGallery) and is then permanently deleted — row, photos, edited_photos,
-- R2 storage. The daily cron (runClientGalleryLifecycle) emails the
-- photographer 14 / 3 / 1 days before expires_at, then deletes.
--
-- deletion_warning_stage tracks which of those 3 warnings has gone out
-- (0 = none, 1 = 14-day sent, 2 = 3-day sent, 3 = 1-day sent), claim-then-send
-- style like the other reminder jobs.

alter table public.galleries
  add column deletion_warning_stage smallint not null default 0;

comment on column public.galleries.deletion_warning_stage is
  'Client-gallery auto-deletion warning progress: 0 none, 1 sent 14-day, 2 sent 3-day, 3 sent 1-day. See lib/private-galleries/client-gallery-lifecycle.ts.';

-- Partial index for the daily lifecycle sweep — only sent client galleries are
-- in the regime (grandfathering: photos_locked_at is null for pre-phase-1 sends).
create index if not exists galleries_client_lifecycle_idx
  on public.galleries (expires_at)
  where gallery_type = 'selection' and photos_locked_at is not null;
