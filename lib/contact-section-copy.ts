import type { SiteLanguage } from '@/lib/site-language'

export const CONTACT_SECTION_DEFAULTS: Record<
  string,
  { title: string; subtitle: string }
> = {
  elegant: {
    title: 'צרי קשר',
    subtitle: 'נשמח לשמוע ממך ולתאם את חווית הצילום המושלמת עבורך.',
  },
  modern: {
    title: 'צרו איתנו קשר',
    subtitle: 'השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או סשן צילומים.',
  },
  classic: {
    title: 'בואו ניצור זיכרונות יחד',
    subtitle:
      'השאירו פרטים ואחזור אליכם בהקדם לתיאום פגישת היכרות נעימה, שבה נתכנן את הצילומים המושלמים עבורכם.',
  },
  dark: {
    title: 'בואו ניצור משהו בלתי נשכח',
    subtitle: 'השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או צילומים.',
  },
}

export const CONTACT_SECTION_DEFAULTS_EN: Record<
  string,
  { title: string; subtitle: string }
> = {
  elegant: {
    title: 'Contact',
    subtitle:
      'We would love to hear from you and plan the perfect photography experience.',
  },
  modern: {
    title: 'Contact Us',
    subtitle:
      'Leave your details and we will get back to you soon to schedule a consultation or photo session.',
  },
  classic: {
    title: "Let's create memories together",
    subtitle:
      'Leave your details and I will get back to you soon for a friendly intro call to plan your perfect shoot.',
  },
  dark: {
    title: "Let's create something unforgettable",
    subtitle:
      'Leave your details and we will get back to you soon to schedule a consultation or session.',
  },
}

export function resolveContactSectionCopy(
  theme: string,
  contactTitle?: string | null,
  contactSubtitle?: string | null,
  language: SiteLanguage = 'he',
) {
  const defaults =
    language === 'en' ? CONTACT_SECTION_DEFAULTS_EN : CONTACT_SECTION_DEFAULTS
  const fallback = defaults[theme] ?? defaults.elegant

  return {
    title: contactTitle?.trim() || fallback.title,
    subtitle: contactSubtitle?.trim() || fallback.subtitle,
  }
}
