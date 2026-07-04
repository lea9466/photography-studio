-- Contact section background images (homepage only)
alter table public.users
  add column if not exists contact_desktop_url text,
  add column if not exists contact_mobile_url text;

comment on column public.users.contact_desktop_url is 'Background image URL for contact section on desktop';
comment on column public.users.contact_mobile_url is 'Background image URL for contact section on mobile (bright, blends into page)';
