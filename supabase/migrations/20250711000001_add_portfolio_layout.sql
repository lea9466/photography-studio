-- Portfolio layout feature: run in Supabase SQL Editor
-- Adds studio-level layout mode toggle (separated vs portfolio).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gallery_layout_mode text NOT NULL DEFAULT 'separated';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_gallery_layout_mode_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_gallery_layout_mode_check
  CHECK (gallery_layout_mode IN ('separated', 'portfolio'));

COMMENT ON COLUMN public.users.gallery_layout_mode IS
  'Homepage gallery display: separated = individual cards, portfolio = unified portfolio page with gallery-name tabs.';
