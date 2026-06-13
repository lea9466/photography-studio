-- איפוס גישה ללקוחות (rate-limit לשכחתי קוד) — Supabase → SQL Editor → Run
-- מנהל פלטפורמה וצלמים: Supabase Auth + resetPasswordForEmail (לא טבלה זו)

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('client')),
  photographer_id uuid REFERENCES photographers (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_email_scope_idx
  ON password_reset_tokens (email, scope, created_at DESC);

CREATE INDEX IF NOT EXISTS password_reset_tokens_token_hash_idx
  ON password_reset_tokens (token_hash);
