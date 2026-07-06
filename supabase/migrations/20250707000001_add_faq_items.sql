-- FAQ items for photographer public homepage
alter table public.users
  add column if not exists faq_items jsonb not null default '[]'::jsonb;

comment on column public.users.faq_items is 'FAQ items ({ question, answer }[]) displayed on the public homepage';
