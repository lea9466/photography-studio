-- כותרות וציטוט בסקשן אודות — הריצי ב-Supabase SQL Editor
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS about_headline_line1 text,
  ADD COLUMN IF NOT EXISTS about_headline_line2 text,
  ADD COLUMN IF NOT EXISTS about_quote text;
