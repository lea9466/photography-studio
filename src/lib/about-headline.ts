export const DEFAULT_ABOUT_HEADLINE_LINE2 = 'מספרת סיפורים **באור**.'
export const DEFAULT_ABOUT_QUOTE = 'אני מצלמת את\nמה שאי-אפשר להגיד'

export function defaultAboutHeadlineLine1(businessName: string): string {
  const first = businessName.trim().split(/\s+/)[0] || businessName.trim() || 'אני'
  return `שלום, אני ${first}`
}

export function resolveAboutHeadlineLine1(
  custom: string | null | undefined,
  businessName: string
): string {
  const trimmed = custom?.trim()
  return trimmed || defaultAboutHeadlineLine1(businessName)
}

export function resolveAboutHeadlineLine2(custom: string | null | undefined): string {
  return custom?.trim() || DEFAULT_ABOUT_HEADLINE_LINE2
}

export function resolveAboutQuote(custom: string | null | undefined): string {
  return custom?.trim() || DEFAULT_ABOUT_QUOTE
}

/** מפרק שורה עם **מילה** להדגשה עם קו תחתון */
export function splitHighlightedPhrase(text: string): Array<{ text: string; highlight: boolean }> {
  const parts: Array<{ text: string; highlight: boolean }> = []
  const regex = /\*\*([^*]+)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlight: false })
    }
    parts.push({ text: match[1], highlight: true })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false })
  }

  if (parts.length === 0) {
    parts.push({ text, highlight: false })
  }

  return parts
}
