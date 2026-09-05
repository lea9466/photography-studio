-- Brand rename: "סטודיו גלריה" / "Studio Gallery" → "STG". The public-site
-- subscription plans carry the old brand only in their `description` field
-- (the `name` field — 'מנוי חודשי' / 'מנוי שנתי' — is what actually reaches
-- SUMIT as the invoice line item and never carried a brand). This realigns
-- the descriptions for any admin view or future use of the field.
--
-- Idempotent: matches on the current text, so re-running or running against
-- an already-migrated row is a no-op. Old seed migrations are left untouched.

begin;

update public.subscription_plans
set description = 'מנוי חודשי ל-STG'
where code = 'studio_monthly'
  and description = 'מנוי חודשי ל-Studio Gallery';

update public.subscription_plans
set description = 'מנוי שנתי ל-STG'
where code = 'studio_yearly'
  and description = 'מנוי שנתי ל-Studio Gallery';

commit;
