/** Desktop/mobile hero lists with each falling back to the other, like the themes' own heroes. */
export function heroImageSets(desktopImages: string[], mobileImages: string[]) {
  return {
    desktop: desktopImages.length ? desktopImages : mobileImages,
    mobile: mobileImages.length ? mobileImages : desktopImages,
  }
}

/** The k-th image, wrapping around when fewer were uploaded. */
export function pickImage(images: string[], k: number): string | null {
  return images.length ? images[k % images.length] : null
}

/** Desktop + mobile uploads together, without duplicates — the film strip uses all of them. */
export function allHeroImages(desktopImages: string[], mobileImages: string[]): string[] {
  return [...new Set([...desktopImages, ...mobileImages])]
}
