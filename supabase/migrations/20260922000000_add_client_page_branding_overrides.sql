-- Client-facing gallery page branding overrides.
--
-- A private client gallery's page takes its logo and accent colour from the
-- studio's public-site branding (users.logo_url / users.accent_color). These two
-- columns let a studio set its own look for client pages only — for studios that
-- don't use the public site, or that want the client page to look different.
-- NULL means "inherit from the site". See lib/actions/client-gallery.actions.ts
-- (resolveClientPageBrand) and lib/actions/client-page-design.actions.ts.

alter table public.users
  add column if not exists client_page_accent_color text,
  add column if not exists client_page_logo_url text;

comment on column public.users.client_page_accent_color is
  'Validated #rrggbb accent for client-facing gallery pages. NULL = inherit users.accent_color.';

comment on column public.users.client_page_logo_url is
  'Path in the branding bucket of a logo used only on client-facing gallery pages. NULL = inherit users.logo_url.';
