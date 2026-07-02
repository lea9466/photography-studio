-- Studio Gallery — testimonials table
-- Client reviews/testimonials for photographers

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  content text not null,
  shoot_type text,
  review_date date,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index testimonials_user_id_idx on public.testimonials (user_id);
create index testimonials_featured_idx on public.testimonials (user_id, is_featured);

comment on table public.testimonials is 'Client reviews/testimonials for photographer studios';
comment on column public.testimonials.title is 'Review title / headline';
comment on column public.testimonials.shoot_type is 'Type of photography session (e.g., wedding, portrait, family)';
comment on column public.testimonials.review_date is 'Photographer-controlled date of the review';
