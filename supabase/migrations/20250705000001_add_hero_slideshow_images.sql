-- Rotating hero: up to 3 desktop + 3 mobile images per photographer
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS hero_desktop_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hero_mobile_urls text[] NOT NULL DEFAULT '{}';

-- Migrate existing single hero images into slot 0
UPDATE public.users
SET hero_desktop_urls = ARRAY[hero_desktop_url]
WHERE hero_desktop_url IS NOT NULL
  AND hero_desktop_url <> ''
  AND (hero_desktop_urls IS NULL OR hero_desktop_urls = '{}');

UPDATE public.users
SET hero_mobile_urls = ARRAY[hero_mobile_url]
WHERE hero_mobile_url IS NOT NULL
  AND hero_mobile_url <> ''
  AND (hero_mobile_urls IS NULL OR hero_mobile_urls = '{}');
