/**
 * The optional personal note a photographer can attach to any email she sends
 * a client (first send, resend, processed photos). Emailed only — never stored.
 */

export const CLIENT_NOTE_MAX_LENGTH = 1000

/** Trimmed, length-capped note, or null when empty. */
export function normalizeClientNote(value: string | null | undefined): string | null {
  const note = value?.trim()
  return note ? note.slice(0, CLIENT_NOTE_MAX_LENGTH) : null
}
