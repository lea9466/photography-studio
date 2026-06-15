-- Photography packages (per photographer)

-- ---------------------------------------------------------------------------
-- photography_packages
-- ---------------------------------------------------------------------------
create table public.photography_packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  price_amount numeric(10, 2) not null,
  duration_text text,
  includes text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index photography_packages_user_id_idx
  on public.photography_packages (user_id);

create index photography_packages_user_sort_idx
  on public.photography_packages (user_id, sort_order);

comment on table public.photography_packages is 'Photographer-defined shooting packages';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger photography_packages_set_updated_at
  before update on public.photography_packages
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.photography_packages enable row level security;

create policy "packages_select_own"
  on public.photography_packages for select
  using (user_id = auth.uid());

create policy "packages_insert_own"
  on public.photography_packages for insert
  with check (user_id = auth.uid());

create policy "packages_update_own"
  on public.photography_packages for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "packages_delete_own"
  on public.photography_packages for delete
  using (user_id = auth.uid());

-- Public read: active packages for photographers with a portfolio gallery
create policy "packages_select_public"
  on public.photography_packages for select
  using (
    is_active = true
    and exists (
      select 1
      from public.galleries g
      where g.user_id = photography_packages.user_id
        and g.gallery_type = 'portfolio'
    )
  );

grant select on table public.photography_packages to anon;
