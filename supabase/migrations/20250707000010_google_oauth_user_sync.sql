-- Google OAuth user sync for public.users (photographer profiles)
-- Run in Supabase SQL Editor if this migration was not applied via CLI.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_avatar_url text;
  v_studio_name text;
begin
  v_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'User'
  );

  v_avatar_url := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'picture'), '')
  );

  v_studio_name := nullif(btrim(new.raw_user_meta_data ->> 'studio_name'), '');

  insert into public.users (
    id,
    email,
    name,
    studio_name,
    logo_url,
    show_welcome_popup
  )
  values (
    new.id,
    new.email,
    v_name,
    v_studio_name,
    v_avatar_url,
    true
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.users.email),
    name = coalesce(nullif(public.users.name, ''), excluded.name),
    logo_url = coalesce(public.users.logo_url, excluded.logo_url),
    studio_name = coalesce(public.users.studio_name, excluded.studio_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

comment on function public.handle_new_user() is
  'Creates or updates public.users when auth.users row is inserted (email signup or Google OAuth).';
