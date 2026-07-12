-- Atmospheric side image for FAQ section (classic/elegant homepage themes)
alter table public.users
  add column if not exists faq_section_image_url text;

comment on column public.users.faq_section_image_url is 'Side feature image for the FAQ section on classic/elegant public homepage themes';
