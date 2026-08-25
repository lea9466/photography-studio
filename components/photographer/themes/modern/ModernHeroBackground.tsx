'use client'

import { useEffect, useRef, useState } from 'react'
import { HERO_EMPTY_PLACEHOLDER_TEXT, MODERN_HERO_FILM_SECONDS_PER_IMAGE } from '@/lib/hero-slideshow'
import styles from './ModernHeroBackground.module.css'

export type ModernHeroBackgroundProps = {
  desktopImages: string[]
  mobileImages: string[]
  videoUrl?: string | null
  alt: string
}

/**
 * One "film belt" layer (either the desktop or the mobile image set) — a
 * continuously-scrolling filmstrip, replacing classic's fade slideshow.
 * Ports `generateModernHeroFilmBeltHTML`/`MODERN_HERO_FILM_BELT_CSS`/
 * `MODERN_HERO_FILM_INIT_SCRIPT` (lib/hero-slideshow.ts) to real React state
 * + a CSS `@keyframes` translate loop, instead of the old imperative script
 * (which had to measure pixel widths with `getBoundingClientRect` +
 * `ResizeObserver` and drive a Web Animations API animation by hand, purely
 * to avoid `vw`-unit subpixel rounding gaps between slides).
 *
 * This port sidesteps that whole problem instead of re-implementing it: the
 * track is duplicated to exactly two copies of the image set and given a
 * width expressed as a *percentage of its own layer* (`--slide-count * 200%`
 * — i.e. 100% per original image, twice over), and each slide's flex-basis
 * is `100% / (slide-count * 2)` of that track. Every one of those
 * percentages resolves against the same box, so slides tile edge-to-edge
 * with no rounding drift, and `translateX(-50%)` (also relative to the
 * track's own width) always shifts by *exactly* one full image set — no
 * JS measurement, ref, or ResizeObserver required, and no gap can ever
 * appear between the belt's two loop copies.
 */
function FilmBeltLayer({
  images,
  alt,
  visibilityClassName,
}: {
  images: string[]
  alt: string
  visibilityClassName: string
}) {
  if (images.length === 0) return null

  // A single image never needs to move — render it as a plain static cover
  // image instead of an animated 2-copy belt (matches
  // generateModernHeroFilmBeltHTML's `images.length <= 1` branch).
  if (images.length === 1) {
    return (
      <div className={`${styles.layer} ${visibilityClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt={alt} className={styles.staticFrame} loading="eager" decoding="async" />
      </div>
    )
  }

  const loop = [...images, ...images]
  const slideCount = loop.length
  const durationSeconds = images.length * MODERN_HERO_FILM_SECONDS_PER_IMAGE

  return (
    <div className={`${styles.layer} ${visibilityClassName}`}>
      {/* Track width must scale with the number of images — each slide needs
          to render at 100% of the LAYER's width (one full-bleed photo at a
          time), which only works if the track itself is `slideCount * 100%`
          wide. A fixed 200% (this used to be a hardcoded CSS value) only
          happens to work when there's exactly 1 image (2 slides total); with
          more images it squeezes all of them into view side by side instead
          of showing one at a time — confirmed by a real screenshot showing 3
          images simultaneously instead of one filling the screen. */}
      <div
        className={styles.track}
        style={{ animationDuration: `${durationSeconds}s`, width: `${slideCount * 100}%` }}
      >
        {loop.map((src, index) => (
          <div key={index} className={styles.slide} style={{ flexBasis: `${100 / slideCount}%` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className={styles.frame} loading="eager" decoding="async" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Video plays over the film belt once it can actually play — same
 * fallback-stays-mounted-underneath approach as ClassicHeroBackground.tsx
 * (a video that fails to decode/autoplay just leaves the belt visible).
 *
 * No dark overlay/scrim over the photos — confirmed by reading
 * lib/hero-slideshow.ts directly, the real source never adds one here (it
 * relies on the title's own text-shadow for contrast instead). An earlier
 * version of this file invented a gradient scrim "for contrast", which made
 * the hero read as noticeably darker than the real production site — a
 * fabricated addition, not a porting gap, so removed rather than kept.
 */
export function ModernHeroBackground({ desktopImages, mobileImages, videoUrl, alt }: ModernHeroBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    setVideoReady(false)
  }, [videoUrl])

  const hasImages = desktopImages.length > 0 || mobileImages.length > 0

  return (
    <div className={styles.belt}>
      {hasImages ? (
        <>
          <FilmBeltLayer
            images={mobileImages.length ? mobileImages : desktopImages}
            alt={alt}
            visibilityClassName="block md:hidden"
          />
          <FilmBeltLayer
            images={desktopImages.length ? desktopImages : mobileImages}
            alt={alt}
            visibilityClassName="hidden md:block"
          />
        </>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{HERO_EMPTY_PLACEHOLDER_TEXT}</p>
        </div>
      )}

      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className={styles.video}
          style={{ opacity: videoReady ? 1 : 0 }}
          onCanPlay={() => {
            videoRef.current
              ?.play()
              .then(() => setVideoReady(true))
              .catch(() => setVideoReady(false))
          }}
          onError={() => setVideoReady(false)}
        />
      ) : null}

    </div>
  )
}
