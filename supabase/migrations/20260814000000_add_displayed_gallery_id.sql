-- Public gallery selection for FREE tier
-- Adds a nullable foreign key to track which gallery is publicly displayed for FREE users
-- Only used when tier = 'free'; PRO users ignore this field

begin;

alter table public.users
  add column if not exists displayed_gallery_id uuid
  references public.galleries(id)
  on delete set null;

create index if not exists idx_users_displayed_gallery_id
  on public.users (displayed_gallery_id);

comment on column public.users.displayed_gallery_id is
  'FREE tier only: the single gallery displayed publicly. Ignored for PRO users.';

commit;