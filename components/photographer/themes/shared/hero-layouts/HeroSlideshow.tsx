'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { HeroTransition } from '@/lib/public-site/hero-settings'
import { cn } from '@/lib/utils'
import styles from './HeroSlideshow.module.css'

type HeroSlideshowProps = {
  images: string[]
  alt: string
  transition: HeroTransition
  speedSeconds: number
}

/** Rotates through the hero photos every `speedSeconds`; a single photo just sits still. */
export function HeroSlideshow({ images, alt, transition, speedSeconds }: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
    if (images.length <= 1) return
    const id = setInterval(() => setActiveIndex((prev) => (prev + 1) % images.length), speedSeconds * 1000)
    return () => clearInterval(id)
  }, [images, speedSeconds])

  return (
    <div
      className={cn(styles.slides, styles[transition])}
      style={{ '--hl-zoom-duration': `${speedSeconds + 1.5}s` } as CSSProperties}
    >
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={index === 0 ? alt : ''}
          aria-hidden={index === 0 ? undefined : true}
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchPriority={index === 0 ? 'high' : 'auto'}
          decoding="async"
          className={cn(styles.slide, index === activeIndex && styles.active)}
        />
      ))}
    </div>
  )
}
