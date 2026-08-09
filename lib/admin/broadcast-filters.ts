export type AdminBroadcastRecipientFilters = {
  /** Studios with at least one gallery */
  requireGallery?: boolean
  /** Studios with at least one blog post */
  requirePost?: boolean
  /** Studios with at least one hero image (desktop or mobile) */
  requireHeroImage?: boolean
}
