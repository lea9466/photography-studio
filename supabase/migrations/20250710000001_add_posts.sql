-- Studio Gallery — posts table for photographer blog posts

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  subtitle text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_user_id_idx on public.posts (user_id);
create index posts_created_at_idx on public.posts (user_id, created_at desc);

comment on table public.posts is 'Photographer blog posts';
comment on column public.posts.subtitle is 'Optional subtitle for the post';

-- ---------------------------------------------------------------------------
-- post_photos
-- ---------------------------------------------------------------------------
create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  original_url text,
  preview_url text,
  watermarked_preview_url text,
  sort_order int not null default 0,
  width int,
  height int,
  created_at timestamptz not null default now()
);

create index post_photos_post_id_idx on public.post_photos (post_id);

comment on table public.post_photos is 'Photos attached to photographer posts (max 10 per post enforced in app)';

-- ---------------------------------------------------------------------------
-- RLS — posts
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;

create policy "posts_select_own"
  on public.posts for select
  using (user_id = auth.uid());

create policy "posts_insert_own"
  on public.posts for insert
  with check (user_id = auth.uid());

create policy "posts_update_own"
  on public.posts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "posts_delete_own"
  on public.posts for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS — post_photos
-- ---------------------------------------------------------------------------
alter table public.post_photos enable row level security;

create policy "post_photos_select_own"
  on public.post_photos for select
  using (
    post_id in (select id from public.posts where user_id = auth.uid())
  );

create policy "post_photos_insert_own"
  on public.post_photos for insert
  with check (
    post_id in (select id from public.posts where user_id = auth.uid())
  );

create policy "post_photos_update_own"
  on public.post_photos for update
  using (
    post_id in (select id from public.posts where user_id = auth.uid())
  )
  with check (
    post_id in (select id from public.posts where user_id = auth.uid())
  );

create policy "post_photos_delete_own"
  on public.post_photos for delete
  using (
    post_id in (select id from public.posts where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Security — revoke anon access (read via server-side only)
-- ---------------------------------------------------------------------------
revoke select on table public.posts from anon;
revoke select on table public.post_photos from anon;
