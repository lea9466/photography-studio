'use client'

import Link from 'next/link'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ClassicBlogPostCard.module.css'

/** Local prop shape — mirrors what blogCard() (lib/public-blog-html.ts) reads
 * off a mapped `PublicBlogPost` row (title/date/content/coverUrl), camelCased
 * and with `content` renamed to `excerpt` since that's the only thing this
 * card ever shows of it (the full body only renders on the single-post page). */
export type ClassicBlogPostCardItem = {
  id: string
  title: string
  date: string
  excerpt: string
  coverUrl: string | null
}

export type ClassicBlogPostCardProps = {
  post: ClassicBlogPostCardItem
  href: string
  accentColor: string
}

/**
 * Classic-theme blog list card — 1:1 port of blogCard()'s non-circle branch
 * (lib/public-blog-html.ts line ~1022): cover image (or an empty gradient
 * placeholder), title, date, and a 2-line-clamped excerpt.
 *
 * Deferred (not built here, see ClassicBlogListPage's docblock): the
 * `displayStyle === 'circles'` alternate presentation, and the hover/focus
 * "quick preview" peek button that opens the post in an in-page modal
 * instead of navigating — this card always navigates to the real post page.
 */
export function ClassicBlogPostCard({ post, href, accentColor }: ClassicBlogPostCardProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLAnchorElement>()
  const hasExcerpt = post.excerpt.trim().length > 0

  return (
    <Link
      ref={ref}
      href={href}
      className={`${styles.card} ${revealed ? styles.isVisible : ''}`}
    >
      <div className={`${styles.media} ${!post.coverUrl ? styles.mediaEmpty : ''}`}>
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.image} src={post.coverUrl} alt={post.title} loading="lazy" />
        ) : null}
      </div>
      <div className={styles.body}>
        <h2 className={styles.title}>{post.title}</h2>
        <p className={styles.date} style={{ color: accentColor }}>
          {post.date}
        </p>
        {hasExcerpt ? <p className={styles.excerpt}>{post.excerpt}</p> : null}
      </div>
    </Link>
  )
}
