-- ערכות עיצוב דינמיות לאתר הציבורי של הצלם
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS theme_style text NOT NULL DEFAULT 'warm';

ALTER TABLE site_settings
  DROP CONSTRAINT IF EXISTS site_settings_theme_style_check;

ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_theme_style_check
  CHECK (theme_style IN ('minimalist', 'cinematic', 'warm', 'creative'));
