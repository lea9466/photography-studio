-- סטטוס deleting — תמונה בתהליך מחיקה (Edge Function ברקע)
-- Supabase → SQL Editor → Run (אחרי images-status.sql)

ALTER TABLE images DROP CONSTRAINT IF EXISTS check_image_status;

ALTER TABLE images
  ADD CONSTRAINT check_image_status
  CHECK (status IN ('pending', 'ready', 'deleting'));

NOTIFY pgrst, 'reload schema';
