-- Add is_featured field to photography_packages for highlighting on home page
alter table public.photography_packages
  add column if not exists is_featured boolean default false not null;
