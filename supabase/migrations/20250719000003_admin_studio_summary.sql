-- Single-round-trip aggregate for /manage studio summary dialog.
-- Callable only via service_role (admin server actions).

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
    'photos', (
      select count(*)::integer
      from public.photos p
      inner join public.galleries g on g.id = p.gallery_id
      where g.user_id = p_user_id
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
    'heroDesktopImages', (select desktop from hero),
    'heroMobileImages', (select mobile from hero),
    'heroImages', (select desktop + mobile from hero)
  );
$$;

comment on function public.admin_studio_summary(uuid) is
  'Aggregated content counts for a studio, used by the admin manage summary dialog.';

revoke all on function public.admin_studio_summary(uuid) from public;
grant execute on function public.admin_studio_summary(uuid) to service_role;
