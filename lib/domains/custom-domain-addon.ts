/**
 * The standalone one-time purchase that unlocks `custom_domain` independent
 * of subscription tier — see lib/subscriptions/entitlements.ts's
 * buildFeatures. Single source of truth for the price so the checkout
 * (lib/payments/payment-service.ts), the verification check on return
 * (app/api/payments/webhooks/sumit/return/route.ts), and the UI copy
 * (components/dashboard/CustomDomainExplainer.tsx /
 * ProFeatureLockedPage on /dashboard/custom-domain) can't drift apart.
 */
export const CUSTOM_DOMAIN_ADDON_PRICE_AGOROT = 9900
export const CUSTOM_DOMAIN_ADDON_PRICE_ILS = CUSTOM_DOMAIN_ADDON_PRICE_AGOROT / 100
export const CUSTOM_DOMAIN_ADDON_ITEM_NAME = 'דומיין אישי — פתיחה חד-פעמית'
