-- Studio Gallery — initial schema
-- Step 1: tables, enums, indexes, auth trigger

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users (photographer profile, 1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  studio_name text,
  logo_url text,
  theme_primary text not null default '#000000',
  theme_secondary text not null default '#ffffff',
  created_at timestamptz not null default now()
);

comment on table public.users is 'Photographer / studio owner profile';

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create index clients_user_id_idx on public.clients (user_id);

-- ---------------------------------------------------------------------------
-- galleries
-- ---------------------------------------------------------------------------
create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  slug text unique,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'selection', 'editing', 'delivery_ready', 'locked')),
  gallery_type text not null default 'selection'
    check (gallery_type in ('selection', 'delivery', 'portfolio')),
  password text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index galleries_user_id_idx on public.galleries (user_id);
create index galleries_client_id_idx on public.galleries (client_id);
create index galleries_status_idx on public.galleries (status);
create index galleries_slug_idx on public.galleries (slug) where slug is not null;

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  original_url text,
  preview_url text,
  watermarked_preview_url text,
  is_visible_to_client boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index photos_gallery_id_idx on public.photos (gallery_id);
create index photos_gallery_sort_idx on public.photos (gallery_id, sort_order);

-- ---------------------------------------------------------------------------
-- photo_selections
-- ---------------------------------------------------------------------------
create table public.photo_selections (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  selected_album boolean not null default false,
  selected_edit boolean not null default false,
  created_at timestamptz not null default now(),
  unique (photo_id, gallery_id)
);

create index photo_selections_gallery_id_idx on public.photo_selections (gallery_id);

-- ---------------------------------------------------------------------------
-- edited_photos
-- ---------------------------------------------------------------------------
create table public.edited_photos (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  final_url text,
  created_at timestamptz not null default now()
);

create index edited_photos_gallery_id_idx on public.edited_photos (gallery_id);
create unique index edited_photos_photo_id_unique on public.edited_photos (photo_id);

-- ---------------------------------------------------------------------------
-- download_jobs
-- ---------------------------------------------------------------------------
create table public.download_jobs (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  type text not null check (type in ('preview', 'original', 'edited')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  file_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index download_jobs_gallery_id_idx on public.download_jobs (gallery_id);
create index download_jobs_status_idx on public.download_jobs (status);

-- ---------------------------------------------------------------------------
-- gallery_settings
-- ---------------------------------------------------------------------------
create table public.gallery_settings (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null unique references public.galleries (id) on delete cascade,
  allow_download_preview boolean not null default false,
  allow_download_original boolean not null default false,
  max_album_selection int,
  max_edit_selection int,
  watermark_text text,
  watermark_position text not null default 'center',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- feedback (marketing contact form)
-- ---------------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('משוב', 'תקלה', 'פיצ׳ר', 'אחר')),
  name text not null,
  email text not null,
  message text not null,
  studio text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create users row on sign-up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Auto-create gallery_settings when gallery is created
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_gallery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.gallery_settings (gallery_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_gallery_created
  after insert on public.galleries
  for each row
  execute function public.handle_new_gallery();
