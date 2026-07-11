-- Admin dashboard announcements shown to photographers

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  icon text not null default 'info',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.announcements is 'Admin-managed banners shown in the photographer dashboard';
comment on column public.announcements.icon is 'Icon key: gift, star, bell, info';

alter table public.announcements enable row level security;

create policy "announcements_select_active"
  on public.announcements for select
  to authenticated
  using (is_active = true);

revoke all on table public.announcements from anon;
grant select on table public.announcements to authenticated;
