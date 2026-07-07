import { buildCanonicalUrl, toAbsoluteMediaUrl } from '@/lib/seo/public-metadata'

type LocalBusinessInput = {
  name: string | null
  studioName: string | null
  aboutText?: string | null
  email?: string | null
  address?: string | null
  canonicalPath: string
  imageUrl?: string | null
}

export function buildPhotographerDescription(input: {
  studioName: string
  aboutText?: string | null
  address?: string | null
}) {
  const parts = [
    input.aboutText?.trim(),
    input.address?.trim()
      ? `סטודיו לצילום ב${input.address.trim()} — ${input.studioName}`
      : null,
    `הפורטפוליו והעבודות של ${input.studioName}. צילום מקצועי, שירות אישי ותוצאות ברמה הגבוהה ביותר.`,
  ]

  return parts.filter(Boolean).join(' ')
}

export function buildPhotographerKeywords(input: {
  studioName: string
  address?: string | null
}) {
  const keywords = [
    input.studioName,
    'צילום מקצועי',
    'צלמת',
    'סטודיו לצילום',
    'גלריות דיגיטליות',
  ]

  const address = input.address?.trim()
  if (address) {
    keywords.push(address, `צילום ב${address}`, `צלמת ב${address}`)
  }

  return keywords
}

export function buildPhotographerLocalBusinessJsonLd(input: LocalBusinessInput) {
  const name = input.studioName?.trim() || input.name?.trim() || 'סטודיו לצילום'
  const address = input.address?.trim()
  const image = toAbsoluteMediaUrl(input.imageUrl)

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name,
    url: buildCanonicalUrl(input.canonicalPath),
    ...(input.aboutText?.trim() ? { description: input.aboutText.trim() } : {}),
    ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    ...(image ? { image } : {}),
    ...(address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: address,
            addressCountry: 'IL',
          },
        }
      : {}),
  }
}
