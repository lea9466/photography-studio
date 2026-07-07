-- Gallery passwords are stored as bcrypt hashes (see lib/gallery-password.ts).
-- Legacy plaintext values are migrated lazily on successful verification.

comment on column public.galleries.password is
  'bcrypt hash of gallery access password; never store plaintext';
