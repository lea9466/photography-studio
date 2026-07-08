/**
 * Image URL utility - returns URLs as-is
 * The system already uses optimized preview/processed images
 */

/**
 * Returns the URL as-is without any CDN transformation
 * The existing pipeline already provides optimized images
 * @param url - The original URL
 * @returns The same URL unchanged
 */
export function optimizeImageUrl(url: string | null): string | null {
  return url
}

/**
 * Returns cover image URL as-is
 * The system already uses optimized preview/processed images
 */
export function optimizeCoverImage(url: string | null): string | null {
  return url
}

/**
 * Returns recent photo URL as-is
 * The system already uses optimized preview/processed images
 */
export function optimizeRecentPhoto(url: string | null): string | null {
  return url
}
