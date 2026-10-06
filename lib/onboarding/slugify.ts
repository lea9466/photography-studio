// Studio-name → URL slug for the onboarding modal. Pure and client-safe so the
// live preview and the server action derive the exact same base slug.

const HEBREW_TO_LATIN: Record<string, string> = {
  ב: 'b', ג: 'g', ד: 'd', ה: 'h', ז: 'z', ח: 'ch', ט: 't', כ: 'k', ך: 'k',
  ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's', ע: 'a', פ: 'p', ף: 'f',
  צ: 'tz', ץ: 'tz', ק: 'k', ר: 'r', ש: 'sh', ת: 't',
}

const MAX_SLUG_LENGTH = 40

function transliterateWord(word: string): string {
  const chars = Array.from(word)
  let out = ''
  chars.forEach((char, index) => {
    const isFirst = index === 0
    const isLast = index === chars.length - 1
    if (char === 'א') out += 'a'
    else if (char === 'ו') out += isFirst ? 'v' : 'o'
    else if (char === 'י') out += isFirst ? 'y' : 'i'
    // A trailing ה is a silent vowel marker ("נועה" → "noa"), not an "h".
    else if (char === 'ה' && isLast && chars.length > 1) out += ''
    else if (HEBREW_TO_LATIN[char]) out += HEBREW_TO_LATIN[char]
    else out += char
  })
  return out
}

export function slugifyStudioName(name: string): string {
  const latin = name
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '') // niqqud / cantillation
    .split(/\s+/)
    .map(transliterateWord)
    .join('-')
    .toLowerCase()

  return latin
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '')
}
