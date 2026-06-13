import type { Metadata } from 'next'
import PlatformLanding from '@/components/platform/PlatformLanding'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'מערכת גלריות לצלמים — פתיחת סטודיו',
  description:
    'מערכת אחת לניהול גלריות, העלאת תמונות כבדות, בחירת לקוחות והורדות באיכות גבוהה. חודש ראשון חינם.',
}

export default function RootPage() {
  return <PlatformLanding />
}
