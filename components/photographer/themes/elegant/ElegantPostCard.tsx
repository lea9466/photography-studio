'use client'

import Link from 'next/link'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import styles from './ElegantPostCard.module.css'

export type ElegantHomepagePost = {
  id: string
  title: string
  content: string
  date: string
  coverUrl: string | null
}

/**
 * `index` drives the same per-card stagger the old renderer applied via
 * `data-reveal-delay="${index * 180}"` (postCard() in
 * lib/homepage-posts-section.ts) — here as a `useRevealOnScroll` delay
 * instead of a global `.stagger-reveal` DOM-attribute script.
 */
export function ElegantPostCard({
  post,
  href,
  accentColor,
  index,
}: {
  post: ElegantHomepagePost
  href: string
  accentColor: string
  index: number
}) {
  const { ref, revealed } = useRevealOnScroll<HTMLAnchorElement>({
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
    delayMs: index * 180,
  })

  return (
    <Link
      ref={ref}
      href={href}
      className={`${styles.card} stagger-reveal ${revealed ? 'is-visible' : ''}`}
    >
      {post.coverUrl ? (
        <div className={styles.media}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverUrl} alt={post.title} className={styles.image} loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className={`${styles.media} ${styles.mediaEmpty}`} aria-hidden="true" />
      )}
      <div className={styles.body}>
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.date} style={{ color: accentColor }}>
          {post.date}
        </p>
        <p className={styles.excerpt}>{post.content}</p>
      </div>
    </Link>
  )
}
