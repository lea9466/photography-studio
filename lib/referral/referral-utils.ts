export function daysUntilTrialEnd(trialEndDate: string | Date): number {
  const end = new Date(trialEndDate)
  const diff = end.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function buildReferralLink(referralCode: string, appUrl?: string) {
  const base = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const code = encodeURIComponent(referralCode.trim())
  return `${base.replace(/\/$/, '')}/register/${code}`
}

export function buildReferralShareText(referralCode: string, appUrl?: string) {
  const link = buildReferralLink(referralCode, appUrl)
  return `📸 חברות צלמות, אתן חייבות לראות את זה!
פתחתי סטודיו דיגיטלי מטורף ב-Studio Galleries להצגת גלריות ללקוחות, וזה פשוט משנה את חוקי המשחק.

במקום לשלוח לינקים מסורבלים, מקבלים אתר פורטפוליו מעוצב ואישי שמציג את הגלריות בצורה הכי מקצועית שיש, מוגן בסימני מים, מאובטח ב-HTTPS, ומה שהכי מדהים – הוא מתאנדקס אוטומטית בגוגל כך שלקוחות חדשים יכולים למצוא את הסטודיו שלכן בקלות בחיפוש!

הרשמו דרך הקישור שלי וקבלו חודש שלם ללא עלות להתנסות בהכל:
${link}`
}
