-- Studio Gallery — Storage buckets + RLS
-- Path convention: {user_id}/{gallery_id}/{filename}
-- originals are NEVER exposed to clients directly (server-side only)

-- ---------------------------------------------------------------------------
-- Buckets (all private — signed URLs or service role for delivery)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'originals',
    'originals',
    false,
    104857600, -- 100 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'previews',
    'previews',
    false,
    20971520, -- 20 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'watermarked',
    'watermarked',
    false,
    20971520,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'edited',
    'edited',
    false,
    104857600,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'zips',
    'zips',
    false,
    524288000, -- 500 MB
    array['application/zip', 'application/x-zip-compressed']
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Helper: check folder belongs to authenticated user
-- storage.foldername(name) returns array of path segments
-- ---------------------------------------------------------------------------
create or replace function public.storage_user_owns_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((storage.foldername(object_name))[1], '') = auth.uid()::text;
$$;

-- ---------------------------------------------------------------------------
-- originals — photographer upload/read/delete only
-- ---------------------------------------------------------------------------
create policy "originals_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'originals' and public.storage_user_owns_path(name));

create policy "originals_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'originals' and public.storage_user_owns_path(name));

create policy "originals_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'originals' and public.storage_user_owns_path(name))
  with check (bucket_id = 'originals' and public.storage_user_owns_path(name));

create policy "originals_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'originals' and public.storage_user_owns_path(name));

-- ---------------------------------------------------------------------------
-- previews
-- ---------------------------------------------------------------------------
create policy "previews_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'previews' and public.storage_user_owns_path(name));

create policy "previews_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'previews' and public.storage_user_owns_path(name));

create policy "previews_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'previews' and public.storage_user_owns_path(name))
  with check (bucket_id = 'previews' and public.storage_user_owns_path(name));

create policy "previews_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'previews' and public.storage_user_owns_path(name));

-- ---------------------------------------------------------------------------
-- watermarked
-- ---------------------------------------------------------------------------
create policy "watermarked_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'watermarked' and public.storage_user_owns_path(name));

create policy "watermarked_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'watermarked' and public.storage_user_owns_path(name));

create policy "watermarked_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'watermarked' and public.storage_user_owns_path(name))
  with check (bucket_id = 'watermarked' and public.storage_user_owns_path(name));

create policy "watermarked_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'watermarked' and public.storage_user_owns_path(name));

-- ---------------------------------------------------------------------------
-- edited
-- ---------------------------------------------------------------------------
create policy "edited_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'edited' and public.storage_user_owns_path(name));

create policy "edited_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'edited' and public.storage_user_owns_path(name));

create policy "edited_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'edited' and public.storage_user_owns_path(name))
  with check (bucket_id = 'edited' and public.storage_user_owns_path(name));

create policy "edited_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'edited' and public.storage_user_owns_path(name));

-- ---------------------------------------------------------------------------
-- zips — generated by server; photographer download
-- ---------------------------------------------------------------------------
create policy "zips_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'zips' and public.storage_user_owns_path(name));

create policy "zips_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'zips' and public.storage_user_owns_path(name));

create policy "zips_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'zips' and public.storage_user_owns_path(name));

-- Client gallery signed-URL access (anon) will be added in Step 6 via
-- service role or dedicated RPC — originals bucket stays photographer-only.
