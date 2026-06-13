<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Supabase

**Env** (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API.

**Client**: `src/lib/supabase.ts` — `createClient<Database>()`. **Types**: `src/lib/database.types.ts`. **Queries**: `src/lib/db.ts` (preferred for new code).

### Tables

| Table | PK | Main FKs | Notes |
|-------|-----|----------|--------|
| `users` | `id` | `auth_id` → Supabase Auth | `role` (admin/client) |
| `clients` | `id` | `user_id` → `users.id` | profile per app user |
| `albums` | `id` | `client_id` → `clients.id` | `cover_image`, `expires_at`, `status` |
| `images` | `id` | `album_id` → `albums.id` | `image_url`, `thumbnail_url` |
| `image_selections` | `id` | `image_id`, `client_id` | `selection_type` |
| `download_logs` | `id` | `image_id`, `client_id` | `downloaded_at` |
| `site_settings` | `id` | — | single row for marketing site |

### Relationships

- `users` 1—* `clients` (typically one client row per user)
- `clients` 1—* `albums`
- `albums` 1—* `images`
- `image_selections` / `download_logs` → `images` + `clients`

### Query examples

```ts
import { supabase } from '@/lib/supabase'
import { fetchAlbumWithImages, fetchClientByUserId, fetchUserByAuthId } from '@/lib/db'

// After sign-in: auth user → app user → client
const user = await fetchUserByAuthId(session.user.id)
const client = user ? await fetchClientByUserId(user.id) : null

// Album + nested images
const album = await fetchAlbumWithImages(albumId)

// Manual join
await supabase.from('albums').select('*, clients(full_name)').eq('id', albumId)
```

### RLS

Public read for marketing: `site_settings`, `albums` (see `supabase/seed.sql`). `users`, `clients`, `images`, `image_selections`, `download_logs` need policies tied to `auth.uid()` / `users.auth_id` before client/admin features work with the anon key.

### Admin (`/admin`)

Server writes use `SUPABASE_SERVICE_ROLE_KEY` via `src/lib/supabase-admin.ts` and `src/lib/admin-db.ts`. UI: `src/components/admin/*`, actions in `src/app/admin/actions.ts`.
