-- Orphaned photo cleanup: reserved rows that never completed upload (original_url IS NULL).
-- Used by pg_cron (optional) and mirrored in app/api/cron/cleanup-orphaned-photos.

create index if not exists photos_orphaned_cleanup_idx
  on public.photos (created_at)
  where original_url is null;

create or replace function public.cleanup_orphaned_photos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.photos
  where original_url is null
    and created_at < now() - interval '24 hours';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_orphaned_photos() from public;
grant execute on function public.cleanup_orphaned_photos() to service_role;

-- Optional: enable pg_cron in Supabase Dashboard (Database → Extensions), then run:
--   select cron.schedule(
--     'cleanup-orphaned-photos',
--     '0 * * * *',
--     $$select public.cleanup_orphaned_photos()$$
--   );
