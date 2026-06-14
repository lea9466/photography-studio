# Supabase — Studio Gallery

## מה נוצר בשלב 1

| קובץ | תוכן |
|------|------|
| `migrations/20250614000001_initial_schema.sql` | 9 טבלאות + triggers |
| `migrations/20250614000002_rls_policies.sql` | RLS לכל טבלה |
| `migrations/20250614000003_storage_buckets.sql` | 5 buckets + storage RLS |
| `../lib/types/database.types.ts` | TypeScript types |

### טבלאות

`users` · `clients` · `galleries` · `photos` · `photo_selections` · `edited_photos` · `download_jobs` · `gallery_settings` · `feedback`

### Storage buckets

`originals` · `previews` · `watermarked` · `edited` · `zips`

**Path convention:** `{user_id}/{gallery_id}/{filename}`

### Triggers אוטומטיים

- **Sign-up** → יוצר שורה ב-`users`
- **Gallery חדשה** → יוצר שורה ב-`gallery_settings`

### הוספות מעבר לפרומפט

- `galleries.slug` — לנתיב `/portfolio/[slug]`
- `photos.sort_order` — ל-pagination וסדר תצוגה
- RLS ציבורי ל-`portfolio` galleries
- RLS insert ציבורי ל-`feedback`

---

## אפשרות א': Supabase CLI (מומלץ לפיתוח)

```bash
# התקנה
npm install -g supabase

# מתוך studio-gallerys/
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# הרצת migrations על cloud
supabase db push

# או local dev
supabase start
supabase db reset   # מריץ את כל ה-migrations + seed
```

## אפשרות ב': SQL Editor (Supabase Dashboard)

1. [supabase.com](https://supabase.com) → Project → **SQL Editor**
2. הרץ לפי סדר:
   - `20250614000001_initial_schema.sql`
   - `20250614000002_rls_policies.sql`
   - `20250614000003_storage_buckets.sql`
   - `20250614000004_user_studio_name_trigger.sql`
   - `20250614000005_grants.sql` ← **חובה** — בלי זה: `permission denied for table galleries`

---

## Storage buckets — Dashboard (גיבוי)

אם ה-migration לא יצר buckets, צור ידנית:

**Storage → New bucket** (כולם **Private**):

| Bucket | Max size |
|--------|----------|
| originals | 100 MB |
| previews | 20 MB |
| watermarked | 20 MB |
| edited | 100 MB |
| zips | 500 MB |

---

## Environment variables (לשלב 2)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server only — never expose to client
RESEND_API_KEY=re_...
```

---

## מה יגיע בשלבים הבאים

- **שלב 6:** RLS/RPC לגלריית לקוח (`/g/[id]`) — גישה עם סיסמה, **ללא** חשיפת `original_url`
- **שלב 13:** signed URLs ל-hורדות zip

---

## Regenerate types (אחרי push)

```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/types/database.types.ts
```
