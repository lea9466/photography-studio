-- Add about and contact card fields to users table
alter table public.users
  add column if not exists about_title text,
  add column if not exists about_subtitle text,
  add column if not exists about_description text,
  add column if not exists contact_card_title text,
  add column if not exists contact_card_description text;

-- Add comments for documentation
comment on column public.users.about_title is 'Title for the About Me section on the homepage';
comment on column public.users.about_subtitle is 'Subtitle for the About Me section on the homepage';
comment on column public.users.about_description is 'Description text for the About Me section on the homepage';
comment on column public.users.contact_card_title is 'Title for the contact card in public gallery views';
comment on column public.users.contact_card_description is 'Description text for the contact card in public gallery views';
