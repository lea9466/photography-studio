-- Photo edit comparisons: store preview + watermarked derivatives (no originals),
-- matching gallery/post display-only upload pipeline.

alter table public.photo_edit_comparisons
  add column if not exists original_watermarked_url text,
  add column if not exists edited_watermarked_url text,
  add column if not exists auto_apply_watermark boolean not null default true,
  add column if not exists watermark_text text;

-- Backfill watermarked paths from preview paths for any existing rows
update public.photo_edit_comparisons
set
  original_watermarked_url = coalesce(original_watermarked_url, original_image_url),
  edited_watermarked_url = coalesce(edited_watermarked_url, edited_image_url)
where original_watermarked_url is null
   or edited_watermarked_url is null;

alter table public.photo_edit_comparisons
  alter column original_watermarked_url set not null,
  alter column edited_watermarked_url set not null;

comment on column public.photo_edit_comparisons.original_image_url is
  'R2 path in previews bucket (compressed display image, no original retained)';
comment on column public.photo_edit_comparisons.original_watermarked_url is
  'R2 path in watermarked bucket for the pre-edit image';
comment on column public.photo_edit_comparisons.edited_image_url is
  'R2 path in previews bucket for the edited image';
comment on column public.photo_edit_comparisons.edited_watermarked_url is
  'R2 path in watermarked bucket for the edited image';
comment on column public.photo_edit_comparisons.auto_apply_watermark is
  'When true, public site serves watermarked derivatives';
comment on column public.photo_edit_comparisons.watermark_text is
  'Optional watermark text used at upload time; falls back to studio name';
