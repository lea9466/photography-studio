import { checkPersistentRateLimit } from '@/lib/rate-limit/persistent'

// 10 write actions/hour per photographer — deliberately low/conservative default
// (see assistant spec §6.4). Checked server-side before every confirmed write,
// not just in the UI, so it can't be bypassed via direct API calls.
const WRITE_MAX_ATTEMPTS = 10
const WRITE_WINDOW_SECONDS = 60 * 60

// Looser limit on chat turns themselves (covers Anthropic API cost, not a
// safety boundary the way the write limit is).
const CHAT_MAX_ATTEMPTS = 40
const CHAT_WINDOW_SECONDS = 60 * 60

export async function checkAssistantWriteRateLimit(userId: string) {
  return checkPersistentRateLimit(`assistant-write:${userId}`, WRITE_MAX_ATTEMPTS, WRITE_WINDOW_SECONDS)
}

export async function checkAssistantChatRateLimit(userId: string) {
  return checkPersistentRateLimit(`assistant-chat:${userId}`, CHAT_MAX_ATTEMPTS, CHAT_WINDOW_SECONDS)
}
