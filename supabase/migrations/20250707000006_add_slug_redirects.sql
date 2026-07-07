create table if not exists public.slug_redirects (
  id bigserial primary key,
  old_slug text not null,
  new_slug text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists slug_redirects_old_slug_idx
  on public.slug_redirects (old_slug);

alter table public.slug_redirects enable row level security;

comment on table public.slug_redirects is '301 redirect map when a studio changes its public slug';
