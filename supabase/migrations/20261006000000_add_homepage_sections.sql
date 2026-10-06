alter table public.users
  add column if not exists homepage_sections jsonb;

comment on column public.users.homepage_sections is
  'Homepage section order + visibility: [{"id":"about","visible":true}, ...]. NULL = default order, all visible. Hero and contact are fixed and not stored here.';
