'use client'

import { useEffect, useRef, useState } from 'react'
import { HERO_EMPTY_PLACEHOLDER_TEXT, HERO_SLIDESHOW_FADE_MS, HERO_SLIDESHOW_INTERVAL_MS } from '@/lib/hero-slideshow'
import styles from './DarkHeroBackground.module.css'

type DarkHeroBackgroundProps = {
  desktopImages: string[]
  mobileImages: string[]
  videoUrl?: string | null
  alt: string
}

function HeroSlideshowLayer({
  images,
  alt,
  visibilityClassName,
}: {
  images: string[]
  alt: string
  visibilityClassName: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }, HERO_SLIDESHOW_INTERVAL_MS)
    return () => clearInterval(id)
  }, [images.length])

  if (images.length === 0) return null

  return (
    <div className={`absolute inset-0 h-full w-full ${visibilityClassName}`}>
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority={index === 0 ? 'high' : 'auto'}
          className={`absolute inset-0 h-full w-full object-cover ${styles.image}`}
          style={{
            opacity: index === activeIndex ? 1 : 0,
            transform: index === activeIndex ? 'scale(1)' : 'scale(1.05)',
            transition: `opacity ${HERO_SLIDESHOW_FADE_MS}ms ease-in-out, transform ${images.length > 1 ? '10000ms' : '0ms'} ease-out`,
            zIndex: index === activeIndex ? 2 : 1,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Same fade-slideshow-with-video-fallback behavior as
 * ClassicHeroBackground.tsx (both themes call the same
 * generateHeroSlideshowHTML() in the old renderer) — the one difference is
 * the `.bold-hero-image` grayscale/contrast filter applied to every frame,
 * ported here as DarkHeroBackground.module.css's `.image` class.
 */
export function DarkHeroBackground({ desktopImages, mobileImages, videoUrl, alt }: DarkHeroBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    setVideoReady(false)
  }, [videoUrl])

  const hasImages = desktopImages.length > 0 || mobileImages.length > 0

  return (
    <div className="relative h-full w-full bg-[#121217]">
      {hasImages ? (
        <>
          <HeroSlideshowLayer
            images={mobileImages.length ? mobileImages : desktopImages}
            alt={alt}
            visibilityClassName="block md:hidden"
          />
          <HeroSlideshowLayer
            images={desktopImages.length ? desktopImages : mobileImages}
            alt={alt}
            visibilityClassName="hidden md:block"
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#1a1a22]">
          <p className="max-w-md px-8 text-center text-white/45">{HERO_EMPTY_PLACEHOLDER_TEXT}</p>
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
          className={`absolute inset-0 z-[3] h-full w-full object-cover transition-opacity duration-300 ${styles.image}`}
          style={{ opacity: videoReady ? 1 : 0, pointerEvents: 'none' }}
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
