'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { galleryCardArrow, type SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from './useRevealOnScroll'
import styles from './HomepageBlogCard.module.css'

export type HomepageBlogCardPost = {
  id: string
  title: string
  content: string
  date: string
  coverUrl: string | null
}

export type HomepageBlogCardProps = {
  post: HomepageBlogCardPost
  href: string
  accentColor: string
  /** 0-based position in the row — drives the number token (newest = 01, as
   * `posts` arrives newest-first) and the entrance stagger. */
  index: number
  /** How many cards are in the row — drives which corner "opens outward". */
  total: number
  language: SiteLanguage
  /** `dark` swaps the surface/ink/shadow palette for dark themes. */
  tone?: 'light' | 'dark'
}

/**
 * The homepage blog-teaser card — one shared "floating card" design across
 * all four themes (Lea, 2026-08, from a reference she supplied): elevated
 * rounded card, image inset from the card edge, a numbered token straddling
 * the image/body boundary, per-position background rotation, and a centered
 * accent-coloured title + 3-line excerpt + "read" CTA with an underline.
 *
 * Shared rather than per-theme (unlike the old `{Theme}PostCard`, which were
 * 1:1 ports of a design that genuinely branched per theme): this markup/CSS
 * is identical everywhere — the only differences are the accent colour
 * (already a per-studio dynamic value), the title font (each theme sets
 * `--headline-font` on its own root, read here the same way
 * shared/SectionTitle does), and light-vs-dark surface tones (`tone` prop).
 * The entrance reveal is self-contained in the module CSS rather than
 * relying on any theme's own `.reveal`/`.stagger-reveal` classes.
 */
export function HomepageBlogCard({
  post,
  href,
  accentColor,
  index,
  total,
  language,
  tone = 'light',
}: HomepageBlogCardProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLAnchorElement>({
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
    delayMs: (index % 4) * 150,
  })

  const arrow = galleryCardArrow(language)
  const readLabel = language === 'en' ? 'Read' : 'לקריאה'
  const number = String(index + 1).padStart(2, '0')
  const position =
    total <= 1 ? 'solo' : index === 0 ? 'first' : index === total - 1 ? 'last' : 'middle'

  return (
    <Link
      ref={ref}
      href={href}
      className={`${styles.card} ${revealed ? styles.visible : ''}`}
      style={{ '--card-accent': accentColor } as CSSProperties}
      data-variant={index % 3}
      data-position={position}
      data-tone={tone}
    >
      <div className={styles.mediaWrap}>
        {post.coverUrl ? (
          <div className={styles.media}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverUrl}
              alt={post.title}
              className={styles.image}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className={`${styles.media} ${styles.mediaEmpty}`} aria-hidden="true" />
        )}
        <span className={styles.number} aria-hidden="true">
          {number}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{post.title}</h3>
        {post.content.trim() ? <p className={styles.excerpt}>{post.content}</p> : null}
        <span className={styles.cta}>
          {readLabel}
          <span className={styles.ctaArrow} aria-hidden="true">
            {arrow}
          </span>
        </span>
      </div>
    </Link>
  )
}
