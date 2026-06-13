-- ═══════════════════════════════════════════════════════════════
-- RLS: כל צלם רואה ומשנה רק את הנתונים שלו
-- Supabase → SQL Editor → הדביקי הכל → Run
-- ═══════════════════════════════════════════════════════════════

-- מחזיר את photographers.id של המשתמש המחובר (auth.uid())
CREATE OR REPLACE FUNCTION public.current_photographer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM photographers
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_photographer_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_photographer_id() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- הפעלת RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums        ENABLE ROW LEVEL SECURITY;
ALTER TABLE images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- clients
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "photographer_select_clients" ON clients;
DROP POLICY IF EXISTS "photographer_insert_clients" ON clients;
DROP POLICY IF EXISTS "photographer_update_clients" ON clients;
DROP POLICY IF EXISTS "photographer_delete_clients" ON clients;

CREATE POLICY "photographer_select_clients"
  ON clients FOR SELECT TO authenticated
  USING (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_insert_clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_update_clients"
  ON clients FOR UPDATE TO authenticated
  USING (photographer_id = public.current_photographer_id())
  WITH CHECK (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_delete_clients"
  ON clients FOR DELETE TO authenticated
  USING (photographer_id = public.current_photographer_id());

-- ─────────────────────────────────────────────────────────────
-- albums
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "photographer_select_albums" ON albums;
DROP POLICY IF EXISTS "photographer_insert_albums" ON albums;
DROP POLICY IF EXISTS "photographer_update_albums" ON albums;
DROP POLICY IF EXISTS "photographer_delete_albums" ON albums;
DROP POLICY IF EXISTS "Public read albums" ON albums;

CREATE POLICY "photographer_select_albums"
  ON albums FOR SELECT TO authenticated
  USING (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_insert_albums"
  ON albums FOR INSERT TO authenticated
  WITH CHECK (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_update_albums"
  ON albums FOR UPDATE TO authenticated
  USING (photographer_id = public.current_photographer_id())
  WITH CHECK (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_delete_albums"
  ON albums FOR DELETE TO authenticated
  USING (photographer_id = public.current_photographer_id());

-- קריאה ציבורית לאלבומים פעילים (דף הבית / גלריה)
CREATE POLICY "public_read_active_albums"
  ON albums FOR SELECT TO anon, authenticated
  USING (status = 'active' AND is_public = true);

-- ─────────────────────────────────────────────────────────────
-- images (אין photographer_id — בדיקה דרך albums)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photographer_select_images" ON images;
DROP POLICY IF EXISTS "photographer_insert_images" ON images;
DROP POLICY IF EXISTS "photographer_update_images" ON images;
DROP POLICY IF EXISTS "photographer_delete_images" ON images;

CREATE POLICY "photographer_select_images"
  ON images FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = images.album_id
        AND a.photographer_id = public.current_photographer_id()
    )
  );

CREATE POLICY "photographer_insert_images"
  ON images FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = images.album_id
        AND a.photographer_id = public.current_photographer_id()
    )
  );

CREATE POLICY "photographer_update_images"
  ON images FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = images.album_id
        AND a.photographer_id = public.current_photographer_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = images.album_id
        AND a.photographer_id = public.current_photographer_id()
    )
  );

CREATE POLICY "photographer_delete_images"
  ON images FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = images.album_id
        AND a.photographer_id = public.current_photographer_id()
    )
  );

-- קריאה ציבורית לתמונות באלבומים ציבוריים
CREATE POLICY "public_read_public_album_images"
  ON images FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums a
      WHERE a.id = images.album_id
        AND a.status = 'active'
        AND a.is_public = true
    )
  );

-- ─────────────────────────────────────────────────────────────
-- packages
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "photographer_select_packages" ON packages;
DROP POLICY IF EXISTS "photographer_insert_packages" ON packages;
DROP POLICY IF EXISTS "photographer_update_packages" ON packages;
DROP POLICY IF EXISTS "photographer_delete_packages" ON packages;

CREATE POLICY "photographer_select_packages"
  ON packages FOR SELECT TO authenticated
  USING (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_insert_packages"
  ON packages FOR INSERT TO authenticated
  WITH CHECK (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_update_packages"
  ON packages FOR UPDATE TO authenticated
  USING (photographer_id = public.current_photographer_id())
  WITH CHECK (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_delete_packages"
  ON packages FOR DELETE TO authenticated
  USING (photographer_id = public.current_photographer_id());

-- קריאה ציבורית לחבילות פעילות (מחירון)
CREATE POLICY "public_read_active_packages"
  ON packages FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- ─────────────────────────────────────────────────────────────
-- site_settings
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "photographer_select_site_settings" ON site_settings;
DROP POLICY IF EXISTS "photographer_insert_site_settings" ON site_settings;
DROP POLICY IF EXISTS "photographer_update_site_settings" ON site_settings;
DROP POLICY IF EXISTS "photographer_delete_site_settings" ON site_settings;
DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;

CREATE POLICY "photographer_select_site_settings"
  ON site_settings FOR SELECT TO authenticated
  USING (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_insert_site_settings"
  ON site_settings FOR INSERT TO authenticated
  WITH CHECK (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_update_site_settings"
  ON site_settings FOR UPDATE TO authenticated
  USING (photographer_id = public.current_photographer_id())
  WITH CHECK (photographer_id = public.current_photographer_id());

CREATE POLICY "photographer_delete_site_settings"
  ON site_settings FOR DELETE TO authenticated
  USING (photographer_id = public.current_photographer_id());

-- קריאה ציבורית להגדרות אתר (דף הבית)
-- הערה: במולטי-טננט מלא יש לסנן לפי tenant; בינתיים כל ההגדרות נגישות לקריאה
CREATE POLICY "public_read_site_settings"
  ON site_settings FOR SELECT TO anon, authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
