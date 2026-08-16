import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseBillingRepository } from '@/lib/payments/repository'

export type MarketingProPricing = {
  monthlyPrice: string
  monthlyCompareAt: string | null
  monthlyBadge: string | null
  yearlyPrice: string
  yearlyCompareAt: string | null
  yearlyBadge: string | null
}

const FALLBACK_PRICING: MarketingProPricing = {
  monthlyPrice: '5',
  monthlyCompareAt: '40',
  monthlyBadge: 'מחיר השקה',
  yearlyPrice: '349',
  yearlyCompareAt: '400',
  yearlyBadge: 'הכי משתלם',
}

function formatShekels(agorot: number) {
  const amount = agorot / 100
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}

export async function getMarketingProPricing(): Promise<MarketingProPricing> {
  try {
    const repository = new SupabaseBillingRepository(createAdminClient())
    const plans = await repository.listActivePlans()
    const monthly = plans.find((p) => p.code === 'studio_monthly')
    const yearly = plans.find((p) => p.code === 'studio_yearly')

    if (!monthly || !yearly) return FALLBACK_PRICING

    return {
      monthlyPrice: formatShekels(monthly.amount_agorot),
      monthlyCompareAt:
        monthly.compare_at_amount_agorot != null ? formatShekels(monthly.compare_at_amount_agorot) : null,
      monthlyBadge: monthly.badge,
      yearlyPrice: formatShekels(yearly.amount_agorot),
      yearlyCompareAt:
        yearly.compare_at_amount_agorot != null ? formatShekels(yearly.compare_at_amount_agorot) : null,
      yearlyBadge: yearly.badge,
    }
  } catch {
    return FALLBACK_PRICING
  }
}
