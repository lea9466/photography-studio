-- Add post cover photo selection + editable blog page title

alter table public.posts
  add column cover_photo_id uuid references public.post_photos (id) on delete set null;

comment on column public.posts.cover_photo_id is 'Selected cover photo shown on the public blog card';

alter table public.users
  add column posts_page_title text;

comment on column public.users.posts_page_title is 'Editable title for the public blog page';
