alter table public.users
  add column if not exists show_welcome_popup boolean not null default true;

-- Existing users should not see the welcome popup
update public.users
set show_welcome_popup = false
where show_welcome_popup = true;

comment on column public.users.show_welcome_popup is 'Show first-time studio setup welcome modal in dashboard';
