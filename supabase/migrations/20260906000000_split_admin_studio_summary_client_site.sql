-- Split the /manage studio summary into its two halves so the admin dialog can
-- show a "site" side and a "private galleries & clients" side (read-only):
--   * client vs. showcase gallery + photo counts (keyed off gallery_type —
--     'selection' = client, 'portfolio' = showcase; see lib/gallery-kind.ts)
--   * gallery-pass credit tallies (paid / consumed / pending)
-- Every key the previous shape returned is kept, so anything still reading the
-- old flat summary keeps working.

create or replace function public.admin_studio_summary(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with studio as (
    select
      faq_items,
      hero_desktop_urls,
      hero_mobile_urls,
      hero_desktop_url,
      hero_mobile_url
    from public.users
    where id = p_user_id
  ),
  hero as (
    select
      case
        when exists (
          select 1
          from unnest(coalesce((select hero_desktop_urls from studio), '{}'::text[])) as path
          where nullif(btrim(path), '') is not null
        ) then (
          select count(*)::integer
          from unnest(coalesce((select hero_desktop_urls from studio), '{}'::text[])) as path
          where nullif(btrim(path), '') is not null
        )
        when nullif(btrim(coalesce((select hero_desktop_url from studio), '')), '') is not null then 1
        else 0
      end as desktop,
      case
        when exists (
          select 1
          from unnest(coalesce((select hero_mobile_urls from studio), '{}'::text[])) as path
          where nullif(btrim(path), '') is not null
        ) then (
          select count(*)::integer
          from unnest(coalesce((select hero_mobile_urls from studio), '{}'::text[])) as path
          where nullif(btrim(path), '') is not null
        )
        when nullif(btrim(coalesce((select hero_mobile_url from studio), '')), '') is not null then 1
        else 0
      end as mobile
  )
  select jsonb_build_object(
    'galleries', (
      select count(*)::integer
      from public.galleries g
      where g.user_id = p_user_id
    ),
    'publicGalleries', (
      select count(*)::integer
      from public.galleries g
      where g.user_id = p_user_id
        and g.is_public = true
    ),
    'clientGalleries', (
      select count(*)::integer
      from public.galleries g
      where g.user_id = p_user_id
        and g.gallery_type = 'selection'
    ),
    'showcaseGalleries', (
      select count(*)::integer
      from public.galleries g
      where g.user_id = p_user_id
        and g.gallery_type = 'portfolio'
    ),
    'photos', (
      select count(*)::integer
      from public.photos p
      inner join public.galleries g on g.id = p.gallery_id
      where g.user_id = p_user_id
    ),
    'clientGalleryPhotos', (
      select count(*)::integer
      from public.photos p
      inner join public.galleries g on g.id = p.gallery_id
      where g.user_id = p_user_id
        and g.gallery_type = 'selection'
    ),
    'showcaseGalleryPhotos', (
      select count(*)::integer
      from public.photos p
      inner join public.galleries g on g.id = p.gallery_id
      where g.user_id = p_user_id
        and g.gallery_type = 'portfolio'
    ),
    'clients', (
      select count(*)::integer
      from public.clients c
      where c.user_id = p_user_id
    ),
    'packages', (
      select count(*)::integer
      from public.photography_packages pkg
      where pkg.user_id = p_user_id
    ),
    'posts', (
      select count(*)::integer
      from public.posts po
      where po.user_id = p_user_id
    ),
    'postPhotos', (
      select count(*)::integer
      from public.post_photos pp
      inner join public.posts po on po.id = pp.post_id
      where po.user_id = p_user_id
    ),
    'faqItems', (
      select count(*)::integer
      from jsonb_array_elements(
        coalesce((select faq_items from studio), '[]'::jsonb)
      ) as elem
      where nullif(btrim(coalesce(elem->>'question', '')), '') is not null
        and nullif(btrim(coalesce(elem->>'answer', '')), '') is not null
    ),
    'testimonials', (
      select count(*)::integer
      from public.testimonials t
      where t.user_id = p_user_id
    ),
    'photoEditComparisons', (
      select count(*)::integer
      from public.photo_edit_comparisons pec
      where pec.user_id = p_user_id
    ),
    'activePhotoEditComparisons', (
      select count(*)::integer
      from public.photo_edit_comparisons pec
      where pec.user_id = p_user_id
        and pec.is_active = true
    ),
    'galleryPassCreditsAvailable', (
      select count(*)::integer
      from public.gallery_pass_credits gpc
      where gpc.user_id = p_user_id
        and gpc.status = 'paid'
    ),
    'galleryPassCreditsConsumed', (
      select count(*)::integer
      from public.gallery_pass_credits gpc
      where gpc.user_id = p_user_id
        and gpc.status = 'consumed'
    ),
    'galleryPassCreditsPending', (
      select count(*)::integer
      from public.gallery_pass_credits gpc
      where gpc.user_id = p_user_id
        and gpc.status = 'pending'
    ),
    'heroDesktopImages', (select desktop from hero),
    'heroMobileImages', (select mobile from hero),
    'heroImages', (select desktop + mobile from hero)
  );
$$;

comment on function public.admin_studio_summary(uuid) is
  'Aggregated content counts for a studio, split into public-site vs. private (client) gallery halves, used by the admin manage summary dialog.';

revoke all on function public.admin_studio_summary(uuid) from public;
grant execute on function public.admin_studio_summary(uuid) to service_role;
