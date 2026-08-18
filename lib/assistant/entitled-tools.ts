import type { StudioEntitlements } from '@/lib/subscriptions/types'
import type { AssistantActionType } from '@/lib/validations/dashboard-assistant'
import { ASSISTANT_ACTION_HANDLERS } from '@/lib/assistant/action-handlers'

// Which assistant tools a studio holds in a given conversation is resolved
// from entitlements *before* the model is called — never as an in-tool
// runtime check (fail-closed, same shape already used for payments — see
// assistant spec §2.7). Each handler's `proFeature` is the single source of
// truth: null means available to every plan, otherwise it must be an
// enabled feature under lib/subscriptions/entitlements.
export function getAllowedAssistantTools(entitlements: StudioEntitlements): AssistantActionType[] {
  return (Object.keys(ASSISTANT_ACTION_HANDLERS) as AssistantActionType[]).filter((actionType) => {
    const feature = ASSISTANT_ACTION_HANDLERS[actionType].proFeature
    return feature === null || entitlements.features[feature]
  })
}

export function isToolAllowedForEntitlements(
  actionType: AssistantActionType,
  entitlements: StudioEntitlements
): boolean {
  const handler = ASSISTANT_ACTION_HANDLERS[actionType]
  if (!handler) return false
  return handler.proFeature === null || entitlements.features[handler.proFeature]
}
