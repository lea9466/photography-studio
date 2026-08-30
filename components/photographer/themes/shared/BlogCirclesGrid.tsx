'use client'

import type { CSSProperties } from 'react'
import { galleryCardArrow } from '@/lib/site-language'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from './useRevealOnScroll'
import styles from './BlogCirclesGrid.module.css'

export type BlogCircleCardItem = {
  id: string
  title: string
  date: string
  excerpt: string
  coverUrl: string | null
  /** Pre-computed, not a callback — some callers (the standalone blog list
   * pages) are Server Components, which can't pass a function prop across
   * into this Client Component (React can't serialize a function value at
   * that boundary). Resolve each post's href with your own hrefForPost
   * before building this array. */
  href: string
}

export type BlogCirclesGridProps = {
  posts: BlogCircleCardItem[]
  accentColor: string
  language: SiteLanguage
  /** Max columns on a wide screen: 4 for the homepage teaser (a full row of
   * 4 when there are 4 posts), 3 everywhere else. The row always fills for
   * fewer posts (3 → 3, 2 → 2, 1 → centred) via `data-count`. */
  columns?: 3 | 4
}

/**
 * The "circles" alternate post grid (`posts_display_style === 'circles'`).
 * Redesigned with Lea 2026-08 ("טיפה על כתם"): the photo sits in a soft
 * organic blob shape rather than a hard circle, over an offset accent-tinted
 * "watercolour stain"; blob + stain morph their `border-radius` gently on
 * hover. Diverges from the old 1:1 port of `.blog-card--circle`
 * (lib/public-blog-html.ts).
 *
 * Still one shared component for all 4 themes — the only theme-dependent bits
 * are the accent colour (a per-studio dynamic value, passed as
 * `--blog-circle-accent`) and the title font (each theme sets
 * `--headline-font` on its own root wrapper, read here the same way
 * shared/SectionTitle does). Every other colour is a `color-mix` of the
 * accent over a translucent base, so it holds on light and dark grounds
 * alike. Links straight to the post page — no quick-preview modal.
 */
export function BlogCirclesGrid({ posts, accentColor, language, columns = 3 }: BlogCirclesGridProps) {
  if (posts.length === 0) return null

  const arrow = galleryCardArrow(language)
  const readCtaLabel = language === 'en' ? 'Read' : 'לקריאה'

  return (
    <div className={styles.grid} data-count={posts.length} data-cols={columns}>
      {posts.map((post, index) => (
        <BlogCircleCard
          key={post.id}
          post={post}
          accentColor={accentColor}
          readCtaLabel={readCtaLabel}
          arrow={arrow}
          delayMs={(index % 3) * 160}
        />
      ))}
    </div>
  )
}

function BlogCircleCard({
  post,
  accentColor,
  readCtaLabel,
  arrow,
  delayMs,
}: {
  post: BlogCircleCardItem
  accentColor: string
  readCtaLabel: string
  arrow: string
  delayMs: number
}) {
  const { ref, revealed } = useRevealOnScroll<HTMLAnchorElement>({ delayMs })

  return (
    <a
      ref={ref}
      href={post.href}
      className={`${styles.card} ${revealed ? styles.visible : ''}`}
      style={{ '--blog-circle-accent': accentColor } as CSSProperties}
    >
      <div className={styles.figure}>
        <span className={styles.stain} aria-hidden="true" />
        <div className={styles.blob}>
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverUrl} alt={post.title} loading="lazy" className={styles.image} />
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
        </div>
      </div>
      <div className={styles.body}>
        <span className={styles.label} style={{ color: accentColor }}>
          {post.date}
        </span>
        <h2 className={styles.title}>{post.title}</h2>
        {post.excerpt.trim() ? <p className={styles.excerpt}>{post.excerpt}</p> : null}
        <span className={styles.cta} style={{ color: accentColor }}>
          {readCtaLabel}
          <span className={styles.ctaArrow} aria-hidden="true">
            {arrow}
          </span>
        </span>
      </div>
    </a>
  )
}
