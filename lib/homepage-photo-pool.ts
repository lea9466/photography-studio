export type PhotoCandidate = {
  path: string
  width: number | null
  height: number | null
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function isLandscape(width: number | null, height: number | null): boolean {
  return width != null && height != null && width > height
}

export function isPortrait(width: number | null, height: number | null): boolean {
  return width != null && height != null && width <= height
}

/** Pick `count` photos, swapping portraits for landscapes when possible (maxChecks attempts). */
export function pickLandscapePreferredPhotos(
  candidates: PhotoCandidate[],
  count: number,
  maxChecks = 20
): PhotoCandidate[] {
  if (candidates.length === 0 || count <= 0) return []

  const shuffled = shuffle(candidates)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))
  let checks = 0

  while (checks < maxChecks) {
    const portraitIndex = selected.findIndex((p) => isPortrait(p.width, p.height))
    if (portraitIndex === -1) break

    const usedPaths = new Set(selected.map((p) => p.path))
    const replacement = shuffled.find(
      (p) => !usedPaths.has(p.path) && isLandscape(p.width, p.height)
    )
    if (!replacement) break

    selected[portraitIndex] = replacement
    checks++
  }

  if (selected.length < count) {
    const usedPaths = new Set(selected.map((p) => p.path))
    for (const candidate of shuffled) {
      if (selected.length >= count) break
      if (usedPaths.has(candidate.path)) continue
      selected.push(candidate)
      usedPaths.add(candidate.path)
    }
  }

  return selected.slice(0, count)
}

/** Build up to 16 paths for homepage rows (4 rows × 4 photos), preferring landscape per row. */
export function buildLandscapePreferredPool(
  candidates: PhotoCandidate[],
  totalCount = 16,
  perRowCount = 4,
  maxChecksPerRow = 20
): string[] {
  let remaining = shuffle(candidates)
  const pool: string[] = []

  while (pool.length < totalCount && remaining.length > 0) {
    const row = pickLandscapePreferredPhotos(remaining, perRowCount, maxChecksPerRow)
    if (row.length === 0) break

    pool.push(...row.map((p) => p.path))
    const usedPaths = new Set(row.map((p) => p.path))
    remaining = remaining.filter((c) => !usedPaths.has(c.path))
  }

  return pool.slice(0, totalCount)
}
