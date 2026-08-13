-- Widens the provider CHECK constraints to allow 'sumit', matching the
-- SumitProvider adapter added under lib/payments/providers/sumit/. Additive
-- only — no existing rows are touched, no data is dropped.

alter table public.billing_customers
  drop constraint billing_customers_provider_check,
  add constraint billing_customers_provider_check
    check (provider in ('payme', 'sumit', 'grow', 'stripe', 'tranzila'));

alter table public.subscription_plans
  drop constraint subscription_plans_provider_check,
  add constraint subscription_plans_provider_check
    check (provider is null or provider in ('payme', 'sumit', 'grow', 'stripe', 'tranzila'));

alter table public.subscriptions
  drop constraint subscriptions_provider_check,
  add constraint subscriptions_provider_check
    check (provider in ('payme', 'sumit', 'grow', 'stripe', 'tranzila'));

alter table public.payment_transactions
  drop constraint payment_transactions_provider_check,
  add constraint payment_transactions_provider_check
    check (provider in ('payme', 'sumit', 'grow', 'stripe', 'tranzila'));

alter table public.payment_webhook_events
  drop constraint payment_webhook_events_provider_check,
  add constraint payment_webhook_events_provider_check
    check (provider in ('payme', 'sumit', 'grow', 'stripe', 'tranzila'));
