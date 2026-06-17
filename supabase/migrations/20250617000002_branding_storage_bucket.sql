-- Studio Gallery — Branding Storage Bucket
-- Create storage bucket for branding images (logo, hero images, about image)

-- Create branding bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'branding',
    'branding',
    false,
    10485760, -- 10 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
on conflict (id) do nothing;

-- Branding bucket RLS policies
create policy "branding_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'branding' and public.storage_user_owns_path(name));

create policy "branding_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'branding' and public.storage_user_owns_path(name));

create policy "branding_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'branding' and public.storage_user_owns_path(name))
  with check (bucket_id = 'branding' and public.storage_user_owns_path(name));

create policy "branding_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'branding' and public.storage_user_owns_path(name));

-- Allow public read access for branding images (for public gallery view)
create policy "branding_public_select"
  on storage.objects for select
  to anon
  using (bucket_id = 'branding');
