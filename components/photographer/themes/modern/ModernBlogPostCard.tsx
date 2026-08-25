'use client'

import Link from 'next/link'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ModernBlogPostCard.module.css'

/** Local prop shape — mirrors ClassicBlogPostCardItem (title/date/excerpt/coverUrl off a mapped `PublicBlogPost` row). */
export type ModernBlogPostCardItem = {
  id: string
  title: string
  date: string
  excerpt: string
  coverUrl: string | null
}

export type ModernBlogPostCardProps = {
  post: ModernBlogPostCardItem
  href: string
  accentColor: string
}

/**
 * Modern-theme blog list card — same shape as ClassicBlogPostCard.tsx (cover
 * image or empty gradient placeholder, title, date, 2-line-clamped excerpt),
 * restyled with modern's rounded-card chrome (see this file's .module.css
 * doc comment).
 */
export function ModernBlogPostCard({ post, href, accentColor }: ModernBlogPostCardProps) {
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
