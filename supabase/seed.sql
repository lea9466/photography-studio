-- הריצי ב-Supabase → SQL Editor → Run
-- ממלאת את site_settings ואלבומים לדוגמה (אם הטבלאות ריקות)

-- קריאה ציבורית (anon) — בטוח לנתוני אתר ציבורי
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
CREATE POLICY "Public read site_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read albums" ON albums;
CREATE POLICY "Public read albums"
  ON albums FOR SELECT
  TO anon, authenticated
  USING (true);

-- הגדרות אתר (שורה אחת)
INSERT INTO site_settings (
  business_name,
  tagline,
  about_text,
  phone,
  email,
  whatsapp,
  years_experience,
  total_clients,
  total_projects,
  primary_color,
  secondary_color,
  hero_image_url
)
SELECT
  'לאה כהן צילום',
  'רגעים שנשארים לנצח',
  'אני לאה, צלמת מקצועית מתל אביב. אני מתמחה בצילומי משפחה, ניו-בורן ואירועים. המטרה שלי היא לתפוס את הרגעים האמיתיים שלכם.',
  '050-0000000',
  'hello@example.com',
  '972500000000',
  8,
  500,
  1200,
  '#4a7c9b',
  '#7ba3bc',
  ''
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

-- אלבומים: אם הטבלה שלך עם עמודות אחרות — ערכי ב-Table Editor
-- או עדכני את השורות למטה לפי העמודות הקיימות אצלך
-- INSERT INTO albums (title) VALUES ('צילומי משפחה'), ('ניו-בורן'), ('אירועים');
