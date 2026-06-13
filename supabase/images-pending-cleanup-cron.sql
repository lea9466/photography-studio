-- ניקוי שורות images בסטטוס pending ישנות מ-2 שעות (העלאה שננטשה / נכשלה)
-- Supabase → Database → Extensions → הפעל pg_cron → SQL Editor → Run
--
-- דורש: images-status.sql (עמודת status) כבר הורץ.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION delete_stale_pending_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stale_ids uuid[];
BEGIN
  SELECT array_agg(id)
  INTO stale_ids
  FROM public.images
  WHERE status = 'pending'
    AND created_at < now() - interval '2 hours';

  IF stale_ids IS NULL OR array_length(stale_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.image_selections WHERE image_id = ANY (stale_ids);
  DELETE FROM public.download_logs WHERE image_id = ANY (stale_ids);
  DELETE FROM public.images WHERE id = ANY (stale_ids);
END;
$$;

-- ביטול משימה קודמת (אם מריצים שוב את הסקריפט)
DO $outer$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid
  FROM cron.job
  WHERE jobname = 'cleanup-stale-pending-images-job';

  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $outer$;

SELECT cron.schedule(
  'cleanup-stale-pending-images-job',
  '0 * * * *',
  $$SELECT delete_stale_pending_images();$$
);

NOTIFY pgrst, 'reload schema';
