-- Studio Gallery — testimonials table
-- Client testimonials for photographers

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  client_name text not null,
  content text not null,
  shoot_type text,
  created_at timestamptz not null default now(),
  is_featured boolean not null default false,
  sort_order int not null default 0
);

create index testimonials_user_id_idx on public.testimonials (user_id);
create index testimonials_featured_idx on public.testimonials (user_id, is_featured);

comment on table public.testimonials is 'Client testimonials for photographer studios';
comment on column public.testimonials.shoot_type is 'Type of photography session (e.g., wedding, portrait, family)';
