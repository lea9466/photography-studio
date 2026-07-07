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

export function resolvePackagesSectionCopy(
  theme: string,
  packagesTitle?: string | null,
  packagesSubtitle?: string | null
) {
  const fallback = PACKAGES_SECTION_DEFAULTS[theme] ?? PACKAGES_SECTION_DEFAULTS.elegant

  return {
    title: packagesTitle?.trim() || fallback.title,
    subtitle: packagesSubtitle?.trim() || fallback.subtitle,
  }
}
