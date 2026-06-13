/** המרת ערך מ-Supabase/טופס למספר שלם לא שלילי. */
export function coerceStat(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Math.max(0, Math.trunc(value))
  }
  if (typeof value === 'string' && value.trim()) {
    const n = parseInt(value.trim(), 10)
    return Number.isNaN(n) ? 0 : Math.max(0, n)
  }
  return 0
}

export function parseFormInt(value: FormDataEntryValue | null): number {
  if (value == null) return 0
  return coerceStat(String(value))
}

/** מספר שלם לא שלילי, או null כשהשדה ריק (למשל "ללא הגבלה"). */
export function parseFormIntOrNull(
  value: FormDataEntryValue | null
): number | null {
  if (value == null) return null
  const str = String(value).trim()
  if (!str) return null
  const n = parseInt(str, 10)
  return Number.isNaN(n) ? null : Math.max(0, n)
}
