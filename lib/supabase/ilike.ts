/**
 * Escapes ILIKE wildcard/escape characters (`%`, `_`, `\`) so user-provided
 * text is always matched literally (case-insensitively) instead of being
 * interpreted as a pattern. Use this any time raw user input reaches
 * `.ilike()` on a Supabase/Postgrest query.
 */
export function escapeIlikePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}
