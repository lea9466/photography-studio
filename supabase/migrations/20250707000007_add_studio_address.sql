alter table public.users
  add column if not exists address text;

comment on column public.users.address is 'Studio physical address for contact section and local SEO';
