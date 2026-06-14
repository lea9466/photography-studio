-- Studio Gallery — table grants for Supabase API roles
-- RLS policies alone are not enough: authenticated/anon need table privileges.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all tables in schema public to authenticated;
grant select, insert on all tables in schema public to anon;

grant all on all sequences in schema public to postgres, service_role;
grant all on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to anon;

alter default privileges in schema public
  grant all on tables to postgres, service_role;

alter default privileges in schema public
  grant all on tables to authenticated;

alter default privileges in schema public
  grant select, insert on tables to anon;

alter default privileges in schema public
  grant all on sequences to postgres, service_role;

alter default privileges in schema public
  grant all on sequences to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to anon;

-- Restrict anon: only feedback insert + portfolio read (RLS enforces row access)
revoke all on table public.users from anon;
revoke all on table public.clients from anon;
revoke all on table public.galleries from anon;
revoke all on table public.photos from anon;
revoke all on table public.photo_selections from anon;
revoke all on table public.edited_photos from anon;
revoke all on table public.download_jobs from anon;
revoke all on table public.gallery_settings from anon;

grant select on table public.galleries to anon;
grant select on table public.photos to anon;
grant insert on table public.feedback to anon;
