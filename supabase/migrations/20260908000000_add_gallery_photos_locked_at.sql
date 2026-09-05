-- Client-gallery lifecycle, phase 1 (docs/private-gallery-lifecycle-plan.md):
-- every client gallery is "one-time use" — its FIRST send freezes the source
-- album, and from that point the photographer can no longer add / delete /
-- replace album photos (only edited deliverables). photos_locked_at is stamped
-- by sendGallery on that first send; a null value means the album is still
-- editable.
--
-- Grandfathering: galleries already sent before this migration keep
-- photos_locked_at = null and stay fully editable — only galleries sent from
-- here on enter the one-time-use regime, so nobody is locked out mid-job.

alter table public.galleries
  add column photos_locked_at timestamptz;

comment on column public.galleries.photos_locked_at is
  'When a client gallery''s source album was frozen (its first send). Null = still editable. Showcase (portfolio) galleries never set this.';
