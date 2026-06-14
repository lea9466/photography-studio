-- Dev seed — runs only with `supabase db reset`
-- Requires a test auth user; replace UUID after first sign-up or use service role.

-- Example portfolio gallery (public read via RLS when gallery_type = 'portfolio')
-- Uncomment and set user_id after creating your first photographer account:

/*
insert into public.clients (user_id, name, email, phone)
values ('YOUR_USER_UUID', 'דנה כהן', 'dana@example.com', '050-1234567');

insert into public.galleries (user_id, client_id, title, slug, status, gallery_type)
values (
  'YOUR_USER_UUID',
  (select id from public.clients where email = 'dana@example.com' limit 1),
  'חתונה — דנה ויוסי',
  'dana-yossi-wedding',
  'draft',
  'portfolio'
);
*/
