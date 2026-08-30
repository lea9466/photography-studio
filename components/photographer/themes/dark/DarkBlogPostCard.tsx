'use client'

import Link from 'next/link'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './DarkBlogPostCard.module.css'

/** Local prop shape — mirrors ClassicBlogPostCardItem/ModernBlogPostCardItem (title/date/excerpt/coverUrl off a mapped `PublicBlogPost` row). */
export type DarkBlogPostCardItem = {
  id: string
  title: string
  date: string
  excerpt: string
  coverUrl: string | null
}

export type DarkBlogPostCardProps = {
  post: DarkBlogPostCardItem
  href: string
  accentColor: string
}

/**
 * Dark-theme blog list card — same shape as Classic/ModernBlogPostCard.tsx
 * (cover image or empty gradient placeholder, title, date, 2-line-clamped
 * excerpt), restyled with dark's own TOKENS.dark card chrome (cardBg
 * #1A1A22, cardRadius 2px, cardBorder 1px solid rgba(255,255,255,0.06) — see
 * lib/public-blog-html.ts's TOKENS map) and Space Grotesk title
 * (titleFontClass('dark') resolves to
 * the real `font-headline` Tailwind key here, unlike the portfolio page's
 * dead `font-headline-md` class).
 */
export function DarkBlogPostCard({ post, href, accentColor }: DarkBlogPostCardProps) {
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
