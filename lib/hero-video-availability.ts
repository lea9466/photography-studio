export type HeroVideoAvailabilityStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'blocked'
  | 'unknown'

export type HeroVideoHttpProbe = {
  status: number
  contentType: string | null
}

export function classifyHeroVideoHttpProbe({
  status,
  contentType,
}: HeroVideoHttpProbe): Exclude<HeroVideoAvailabilityStatus, 'idle' | 'checking'> {
  const normalizedType = contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? ''

  if (status === 418 || status === 403 || status === 451) {
    return 'blocked'
  }
  if (normalizedType === 'text/html') {
    return 'blocked'
  }
  if ((status === 200 || status === 206) && normalizedType === 'video/mp4') {
    return 'available'
  }
  return 'unknown'
}

export async function resolveHeroVideoAvailability(input: {
  probeMetadata: () => Promise<boolean>
  probeHttp: () => Promise<HeroVideoHttpProbe>
}): Promise<Exclude<HeroVideoAvailabilityStatus, 'idle' | 'checking'>> {
  if (await input.probeMetadata()) return 'available'

  try {
    return classifyHeroVideoHttpProbe(await input.probeHttp())
  } catch {
    // CORS and generic browser network failures are not proof of filtering.
    return 'unknown'
  }
}
