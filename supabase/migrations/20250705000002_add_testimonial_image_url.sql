-- Optional square thumbnail for testimonials (album photo or uploaded image)
alter table public.testimonials
  add column if not exists image_url text;

comment on column public.testimonials.image_url is
  'Storage reference: previews:path, edited:path, or branding:path';
