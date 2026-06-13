-- תמונת Hero נפרדת למובייל (דסקטופ נשאר ב-hero_image_url)
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS hero_image_url_mobile text;

NOTIFY pgrst, 'reload schema';
