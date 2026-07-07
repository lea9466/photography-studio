-- Custom Hebrew title for the testimonials section on the public homepage
alter table public.users
  add column if not exists testimonials_title text;

comment on column public.users.testimonials_title is 'Hebrew title for testimonials section on public homepage';
