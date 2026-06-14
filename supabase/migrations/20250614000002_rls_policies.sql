-- Studio Gallery — Row Level Security
-- Photographers: full access to own data via auth.uid()
-- Public/client policies added in later steps (gallery password gate)

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

create policy "users_select_self"
  on public.users for select
  using (id = auth.uid());

create policy "users_insert_self"
  on public.users for insert
  with check (id = auth.uid());

create policy "users_update_self"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users_delete_self"
  on public.users for delete
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;

create policy "clients_select_own"
  on public.clients for select
  using (user_id = auth.uid());

create policy "clients_insert_own"
  on public.clients for insert
  with check (user_id = auth.uid());

create policy "clients_update_own"
  on public.clients for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "clients_delete_own"
  on public.clients for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- galleries
-- ---------------------------------------------------------------------------
alter table public.galleries enable row level security;

create policy "galleries_select_own"
  on public.galleries for select
  using (user_id = auth.uid());

create policy "galleries_insert_own"
  on public.galleries for insert
  with check (user_id = auth.uid());

create policy "galleries_update_own"
  on public.galleries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "galleries_delete_own"
  on public.galleries for delete
  using (user_id = auth.uid());

-- Public read for portfolio galleries (no auth required)
create policy "galleries_select_portfolio_public"
  on public.galleries for select
  using (gallery_type = 'portfolio');

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
alter table public.photos enable row level security;

create policy "photos_select_own"
  on public.photos for select
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "photos_insert_own"
  on public.photos for insert
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "photos_update_own"
  on public.photos for update
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  )
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "photos_delete_own"
  on public.photos for delete
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- photo_selections
-- ---------------------------------------------------------------------------
alter table public.photo_selections enable row level security;

create policy "selections_select_own"
  on public.photo_selections for select
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "selections_insert_own"
  on public.photo_selections for insert
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "selections_update_own"
  on public.photo_selections for update
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  )
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "selections_delete_own"
  on public.photo_selections for delete
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- edited_photos
-- ---------------------------------------------------------------------------
alter table public.edited_photos enable row level security;

create policy "edited_select_own"
  on public.edited_photos for select
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "edited_insert_own"
  on public.edited_photos for insert
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "edited_update_own"
  on public.edited_photos for update
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  )
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "edited_delete_own"
  on public.edited_photos for delete
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- download_jobs
-- ---------------------------------------------------------------------------
alter table public.download_jobs enable row level security;

create policy "downloads_select_own"
  on public.download_jobs for select
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "downloads_insert_own"
  on public.download_jobs for insert
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "downloads_update_own"
  on public.download_jobs for update
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  )
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "downloads_delete_own"
  on public.download_jobs for delete
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- gallery_settings
-- ---------------------------------------------------------------------------
alter table public.gallery_settings enable row level security;

create policy "settings_select_own"
  on public.gallery_settings for select
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "settings_insert_own"
  on public.gallery_settings for insert
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "settings_update_own"
  on public.gallery_settings for update
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  )
  with check (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

create policy "settings_delete_own"
  on public.gallery_settings for delete
  using (
    gallery_id in (select id from public.galleries where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- feedback — public insert only (contact form)
-- ---------------------------------------------------------------------------
alter table public.feedback enable row level security;

create policy "feedback_insert_public"
  on public.feedback for insert
  with check (true);

-- Photographers read their own feedback submissions is N/A;
-- admin reads via service role key in server actions.
