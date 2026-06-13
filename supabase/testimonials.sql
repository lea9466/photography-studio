-- המלצות לקוחות: הריצי ב-Supabase → SQL Editor → Run
-- לקוח שולח המלצה (ממתין) → אדמין מאשר → מוצג בדף הבית מתחת לגלריות

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT testimonials_content_min CHECK (char_length(trim(content)) >= 10)
);

CREATE INDEX IF NOT EXISTS testimonials_status_idx ON testimonials (status);
CREATE INDEX IF NOT EXISTS testimonials_client_id_idx ON testimonials (client_id);

-- לקוח אחד — המלצה ממתינה אחת בכל זמן
CREATE UNIQUE INDEX IF NOT EXISTS testimonials_one_pending_per_client
  ON testimonials (client_id)
  WHERE status = 'pending';

-- לקוח אחד — המלצה מאושרת אחת בכל זמן (לפרסום באתר)
CREATE UNIQUE INDEX IF NOT EXISTS testimonials_one_approved_per_client
  ON testimonials (client_id)
  WHERE status = 'approved';

NOTIFY pgrst, 'reload schema';
