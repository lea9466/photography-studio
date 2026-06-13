-- סטטוס תמונה: pending (שורה שמורה לפני העלאה ל-R2) | ready (הועלתה במלואה)
-- Supabase → SQL Editor → Run

ALTER TABLE images ADD COLUMN IF NOT EXISTS status text;

-- תמונות קיימות לפני המיגרציה — כבר הועלו; אל תסתירו אותן מהלקוח
UPDATE images SET status = 'ready' WHERE status IS NULL;

ALTER TABLE images ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE images ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_image_status'
  ) THEN
    ALTER TABLE images
      ADD CONSTRAINT check_image_status
      CHECK (status IN ('pending', 'ready'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_images_album_status ON images(album_id, status);

NOTIFY pgrst, 'reload schema';
