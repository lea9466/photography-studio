-- Custom title and subtitle for the contact form section on the public homepage.
-- Applies across all themes (elegant/modern/classic/dark); when left empty the
-- theme's existing default copy is used (see lib/contact-section-copy.ts).
alter table public.users
  add column if not exists contact_title text,
  add column if not exists contact_subtitle text;

comment on column public.users.contact_title is 'Custom title for the contact form section on the public homepage (falls back to theme default when empty)';
comment on column public.users.contact_subtitle is 'Custom subtitle for the contact form section on the public homepage (falls back to theme default when empty)';
