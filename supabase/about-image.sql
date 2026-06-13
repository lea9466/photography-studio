-- תמונת סקשן אודות — נפרדת מתמונת Hero
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS about_image_url text;
