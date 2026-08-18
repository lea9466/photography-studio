export type AdminBroadcastRecipientFilters = {
  /** Studios with at least one gallery */
  requireGallery?: boolean
  /** Studios with no galleries at all */
  excludeGallery?: boolean
  /** Studios with at least one blog post */
  requirePost?: boolean
  /** Studios with at least one hero image (desktop or mobile) */
  requireHeroImage?: boolean
  /**
   * Stable 50/50 split of all recipients into two groups, so a large list can be
   * mailed across two days without exceeding a provider's daily sending limit
   * and without any recipient shifting groups between sends.
   */
  group?: 'A' | 'B' | null
}
