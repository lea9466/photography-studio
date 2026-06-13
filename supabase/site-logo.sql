-- לוגו האתר: הריצי ב-Supabase → SQL Editor → Run
-- מופיע בהדר, בראש דף הבית ובאזור יצירת קשר (כשמוגדר URL)

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url text;

NOTIFY pgrst, 'reload schema';
