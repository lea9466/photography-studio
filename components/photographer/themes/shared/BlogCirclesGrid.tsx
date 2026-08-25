'use client'

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
}

export type BlogCirclesGridProps = {
  posts: BlogCircleCardItem[]
  accentColor: string
  language: SiteLanguage
  hrefForPost: (postId: string) => string
}

/**
 * The "circles" alternate post grid (`posts_display_style === 'circles'`) —
 * 1:1 port of `.blog-grid--circles`/`.blog-card--circle` in
 * lib/public-blog-html.ts's blogCard()/blogBody(). Shared across all 4
 * themes rather than ported once per theme (like the regular card grids
 * are): checked the real source directly and this markup/CSS is byte-for-
 * byte identical regardless of theme there — the only theme-dependent bits
 * are the accent color (already a per-studio dynamic value here) and the
 * title font, which every theme already exposes as --headline-font on its
 * own root wrapper, so this reads it the same way shared/SectionTitle.tsx
 * does instead of taking a font prop.
 *
 * Not ported: the hover/focus "quick preview" peek button + in-page modal
 * (BLOG_MODAL_INIT_SCRIPT) — same simplification every theme's regular card
 * grid already made (see e.g. ClassicBlogListPage.tsx's doc comment); cards
 * here always link straight to the real post page instead.
 */
export function BlogCirclesGrid({ posts, accentColor, language, hrefForPost }: BlogCirclesGridProps) {
  if (posts.length === 0) return null

  const arrow = galleryCardArrow(language)
  const readCtaLabel = language === 'en' ? 'Read' : 'לקריאה'

  return (
    <div className={styles.grid}>
      {posts.map((post, index) => (
        <BlogCircleCard
          key={post.id}
          post={post}
          href={hrefForPost(post.id)}
          accentColor={accentColor}
          readCtaLabel={readCtaLabel}
          arrow={arrow}
          delayMs={(index % 3) * 180}
        />
      ))}
    </div>
  )
}

function BlogCircleCard({
  post,
  href,
  accentColor,
  readCtaLabel,
  arrow,
  delayMs,
}: {
  post: BlogCircleCardItem
  href: string
  accentColor: string
  readCtaLabel: string
  arrow: string
  delayMs: number
}) {
  const { ref, revealed } = useRevealOnScroll<HTMLAnchorElement>({ delayMs })

  return (
    <a
      ref={ref}
      href={href}
      className={`${styles.card} ${revealed ? styles.visible : ''}`}
      style={{ '--blog-circle-accent': accentColor } as React.CSSProperties}
    >
      <div className={styles.media}>
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt={post.title} loading="lazy" className={styles.image} />
        ) : null}
        <span className={styles.veil} aria-hidden="true" />
      </div>
      <div className={styles.body}>
        <span className={styles.label} style={{ color: accentColor }}>
          {post.date}
        </span>
        <h2 className={styles.title}>{post.title}</h2>
        {post.excerpt.trim() ? <p className={styles.excerpt}>{post.excerpt}</p> : null}
        <span className={styles.cta} style={{ color: accentColor }}>
          {readCtaLabel} <span aria-hidden="true">{arrow}</span>
        </span>
      </div>
    </a>
  )
}
