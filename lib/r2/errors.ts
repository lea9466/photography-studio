export function formatR2Error(error: unknown): string {
  if (!(error instanceof Error)) return 'שגיאה בהעלאה ל-R2'

  const serialized = safeStringify(error)
  if (serialized.includes('netfree')) {
    return (
      'נטפרי חוסם גישה ל-Cloudflare R2 מהמחשב. ' +
      'הוסיפו לרשימה הלבנה: *.r2.cloudflarestorage.com (או נסו העלאה מהשרת בענן).'
    )
  }

  const err = error as Error & {
    Code?: string
    name?: string
    $metadata?: { httpStatusCode?: number }
  }
  const status = err.$metadata?.httpStatusCode
  if (status === 418) {
    return (
      'הבקשה נחסמה (HTTP 418). אם יש נטפרי — הוסיפו *.r2.cloudflarestorage.com לרשימה הלבנה.'
    )
  }

  const parts: string[] = []
  if (err.name && err.name !== 'Error') parts.push(err.name)
  if (err.Code) parts.push(err.Code)
  if (err.message && err.message !== 'UnknownError') parts.push(err.message)
  else if (err.message) parts.push(err.message)
  if (status) parts.push(`HTTP ${status}`)
  return parts.length ? parts.join(' — ') : 'שגיאה בהעלאה ל-R2'
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}
