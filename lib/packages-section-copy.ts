import type { SiteLanguage } from '@/lib/site-language'

export const PACKAGES_SECTION_DEFAULTS: Record<
  string,
  { title: string; subtitle: string }
> = {
  elegant: {
    title: 'חבילות שירות',
    subtitle: 'השקעה בזיכרונות שיישארו לנצח',
  },
  modern: {
    title: 'חבילות הצילום שלנו',
    subtitle: 'בחרו את החבילה המתאימה ליותר עבורכם',
  },
  classic: {
    title: 'חבילות צילום',
    subtitle: 'השקעה ברגעי קסם',
  },
  dark: {
    title: 'חבילות וצילום',
    subtitle:
      'אנחנו מציעים מגוון אפשרויות שיתאימו לצרכים האישיים והעסקיים שלכם, עם דגש על איכות בלתי מתפשרת.',
  },
}

export const PACKAGES_SECTION_DEFAULTS_EN: Record<
  string,
  { title: string; subtitle: string }
> = {
  elegant: {
    title: 'Our Packages',
    subtitle: 'An investment in memories that last forever',
  },
  modern: {
    title: 'Our Photography Packages',
    subtitle: 'Choose the package that fits you best',
  },
  classic: {
    title: 'Photography Packages',
    subtitle: 'An investment in magical moments',
  },
  dark: {
    title: 'Packages & Photography',
    subtitle:
      'We offer a range of options for personal and business needs, with an emphasis on uncompromising quality.',
  },
}

export function resolvePackagesSectionCopy(
  theme: string,
  packagesTitle?: string | null,
  packagesSubtitle?: string | null,
  language: SiteLanguage = 'he',
) {
  const defaults =
    language === 'en' ? PACKAGES_SECTION_DEFAULTS_EN : PACKAGES_SECTION_DEFAULTS
  const fallback = defaults[theme] ?? defaults.elegant

  return {
    title: packagesTitle?.trim() || fallback.title,
    subtitle: packagesSubtitle?.trim() || fallback.subtitle,
  }
}
