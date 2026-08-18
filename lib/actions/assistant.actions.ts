'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { checkAssistantWriteRateLimit } from '@/lib/assistant/rate-limiter'
import { recordAssistantAction, markAssistantActionUndone, getUndoableAssistantAction } from '@/lib/assistant/audit-log'
import { isToolAllowedForEntitlements } from '@/lib/assistant/entitled-tools'
import { ASSISTANT_ACTION_HANDLERS } from '@/lib/assistant/action-handlers'
import {
  updateAboutSectionSchema,
  updateContactFormSchema,
  createPackageSchema,
  updatePackageSchema,
  deletePackageSchema,
  createBlogPostSchema,
  addFaqItemSchema,
  updateThemeSchema,
  createTestimonialSchema,
  deleteBlogPostSchema,
  deleteFaqItemSchema,
  deleteTestimonialSchema,
  setHeroImageSchema,
  setSlugSchema,
  type AssistantActionType,
} from '@/lib/validations/dashboard-assistant'

const SCHEMA_BY_ACTION = {
  update_about_section: updateAboutSectionSchema,
  update_contact_form: updateContactFormSchema,
  create_package: createPackageSchema,
  update_package: updatePackageSchema,
  delete_package: deletePackageSchema,
  create_blog_post: createBlogPostSchema,
  add_faq_item: addFaqItemSchema,
  update_theme: updateThemeSchema,
  create_testimonial: createTestimonialSchema,
  delete_blog_post: deleteBlogPostSchema,
  delete_faq_item: deleteFaqItemSchema,
  delete_testimonial: deleteTestimonialSchema,
  set_hero_image: setHeroImageSchema,
  set_slug: setSlugSchema,
} as const

export async function confirmAssistantAction(actionType: AssistantActionType, payload: unknown) {
  const { userId, supabase } = await requireDashboardContext()

  const entitlements = await getStudioEntitlements(userId)
  if (!isToolAllowedForEntitlements(actionType, entitlements)) {
    throw new Error('הפעולה הזו אינה זמינה בתוכנית הנוכחית')
  }

  const rateLimit = await checkAssistantWriteRateLimit(userId)
  if (!rateLimit.allowed) {
    throw new Error('הגעת למגבלת הפעולות של העוזר לשעה זו — נסי שוב מאוחר יותר')
  }

  const schema = SCHEMA_BY_ACTION[actionType]
  const handler = ASSISTANT_ACTION_HANDLERS[actionType]
  if (!schema || !handler) throw new Error('פעולה לא מוכרת')

  const parsed = schema.parse(payload) as Record<string, unknown>
  const { previousState } = await handler.execute({ userId, supabase }, parsed)

  const logId = await recordAssistantAction(supabase, userId, actionType, parsed, previousState)

  revalidatePath('/dashboard')

  return { success: true as const, logId }
}

export async function undoLastAssistantAction(logId: string) {
  const { userId, supabase } = await requireDashboardContext()

  const action = await getUndoableAssistantAction(supabase, userId, logId)
  if (!action) throw new Error('לא ניתן לבטל את הפעולה הזו — ייתכן שחלף הזמן המותר')

  const handler = ASSISTANT_ACTION_HANDLERS[action.action_type as AssistantActionType]
  if (!handler) throw new Error('פעולה לא מוכרת')

  await handler.undo({ userId, supabase }, action.previous_state)
  await markAssistantActionUndone(supabase, userId, logId)

  revalidatePath('/dashboard')

  return { success: true as const }
}
