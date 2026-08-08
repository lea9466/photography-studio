import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { PaymentService } from './payment-service'
import { createPaymentProvider } from './provider-factory'
import { SupabaseBillingRepository } from './repository'

export function createPaymentService() {
  const repository = new SupabaseBillingRepository(createAdminClient())
  return new PaymentService(repository, createPaymentProvider)
}
