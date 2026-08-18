import type { requireDashboardContext } from '@/lib/auth/dashboard-context'
import type { AssistantActionType } from '@/lib/validations/dashboard-assistant'

type DashboardSupabaseClient = Awaited<ReturnType<typeof requireDashboardContext>>['supabase']

// Undo is only offered for the most recent action, within a short window —
// see assistant spec §3.1. After this, only manual editing in the dashboard.
const UNDO_WINDOW_MS = 10 * 60 * 1000

export type AssistantActionLogRow = {
  id: string
  user_id: string
  action_type: string
  payload: Record<string, unknown>
  previous_state: Record<string, unknown>
  created_at: string
  undone_at: string | null
}

export async function recordAssistantAction(
  supabase: DashboardSupabaseClient,
  userId: string,
  actionType: AssistantActionType,
  payload: Record<string, unknown>,
  previousState: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabase
    .from('assistant_action_log')
    .insert({
      user_id: userId,
      action_type: actionType,
      payload,
      previous_state: previousState,
    } as never)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

export async function getUndoableAssistantAction(
  supabase: DashboardSupabaseClient,
  userId: string,
  logId: string
): Promise<AssistantActionLogRow | null> {
  const { data, error } = await supabase
    .from('assistant_action_log')
    .select('*')
    .eq('id', logId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as unknown as AssistantActionLogRow
  if (row.undone_at) return null

  const ageMs = Date.now() - new Date(row.created_at).getTime()
  if (ageMs > UNDO_WINDOW_MS) return null

  return row
}

export async function markAssistantActionUndone(
  supabase: DashboardSupabaseClient,
  userId: string,
  logId: string
): Promise<void> {
  const { error } = await supabase
    .from('assistant_action_log')
    .update({ undone_at: new Date().toISOString() } as never)
    .eq('id', logId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
