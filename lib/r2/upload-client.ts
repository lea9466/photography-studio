export async function putToPresignedUrl(url: string, body: Blob | File) {
  let response: Response
  try {
    // Presigned URL is signed for host only — do not send Content-Type from the browser.
    response = await fetch(url, { method: 'PUT', body })
  } catch (error) {
    const netfree =
      error instanceof TypeError &&
      (error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Load failed'))
    if (netfree) {
      throw new Error(
        'נטפרי חוסם את ההעלאה ל-R2. הוסיפו *.r2.cloudflarestorage.com לרשימה הלבנה (כמו ב-photography-studio).'
      )
    }
    throw error instanceof Error ? error : new Error('העלאה ל-R2 נכשלה')
  }

  if (!response.ok) {
    if (response.status === 418) {
      throw new Error(
        'הבקשה נחסמה (HTTP 418). אם יש נטפרי — הוסיפו *.r2.cloudflarestorage.com לרשימה הלבנה.'
      )
    }
    throw new Error(`העלאה ל-R2 נכשלה (HTTP ${response.status})`)
  }
}

export { formatR2Error } from '@/lib/r2/errors'
