-- הריצי ב-Supabase → SQL Editor (אחרי יצירת bucket בשם albums — Public)

-- קריאה ציבורית לקבצים ב-bucket albums
DROP POLICY IF EXISTS "Public read albums bucket" ON storage.objects;
CREATE POLICY "Public read albums bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'albums');
