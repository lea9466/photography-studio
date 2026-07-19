-- Studio Gallery — photo edit comparisons (before/after editing)
-- Ownership: user_id (= photographer / studio owner), matching existing multi-tenant model.

-- ---------------------------------------------------------------------------
-- photo_edit_comparisons
-- ---------------------------------------------------------------------------
create table if not exists public.photo_edit_comparisons (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.users(id)
    on delete cascade,

  title text null,

  description text null,

  -- Compressed preview paths (previews bucket) — originals are never stored
  original_image_url text not null,
  original_watermarked_url text not null,

  edited_image_url text not null,
  edited_watermarked_url text not null,

  auto_apply_watermark boolean not null default true,
  watermark_text text null,

  display_style text not null default 'development'
    check (display_style in ('development', 'reveal')),

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists photo_edit_comparisons_user_id_idx
  on public.photo_edit_comparisons(user_id);

create index if not exists photo_edit_comparisons_user_sort_idx
  on public.photo_edit_comparisons(user_id, sort_order);

create index if not exists photo_edit_comparisons_user_active_idx
  on public.photo_edit_comparisons(user_id, is_active)
  where is_active = true;

comment on table public.photo_edit_comparisons is
  'Before/after photo edit pairs for photographer public sites';
comment on column public.photo_edit_comparisons.original_image_url is
  'R2 path in previews bucket for the pre-edit compressed image';
comment on column public.photo_edit_comparisons.original_watermarked_url is
  'R2 path in watermarked bucket for the pre-edit image';
comment on column public.photo_edit_comparisons.edited_image_url is
  'R2 path in previews bucket for the edited compressed image';
comment on column public.photo_edit_comparisons.edited_watermarked_url is
  'R2 path in watermarked bucket for the edited image';
comment on column public.photo_edit_comparisons.auto_apply_watermark is
  'When true, public site serves watermarked derivatives';
comment on column public.photo_edit_comparisons.display_style is
  'Public display mode: development (implemented) or reveal (reserved)';

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses public.set_updated_at when present)
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

drop trigger if exists photo_edit_comparisons_set_updated_at
  on public.photo_edit_comparisons;

create trigger photo_edit_comparisons_set_updated_at
  before update on public.photo_edit_comparisons
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — owner-only CRUD (public reads via service-role admin client)
-- ---------------------------------------------------------------------------
alter table public.photo_edit_comparisons enable row level security;

create policy "photo_edit_comparisons_select_own"
  on public.photo_edit_comparisons for select
  using (user_id = auth.uid());

create policy "photo_edit_comparisons_insert_own"
  on public.photo_edit_comparisons for insert
  with check (user_id = auth.uid());

create policy "photo_edit_comparisons_update_own"
  on public.photo_edit_comparisons for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "photo_edit_comparisons_delete_own"
  on public.photo_edit_comparisons for delete
  using (user_id = auth.uid());

revoke select on table public.photo_edit_comparisons from anon;
