alter table public.users
  add column if not exists phone text;

comment on column public.users.phone is 'Studio phone number for contact section';
