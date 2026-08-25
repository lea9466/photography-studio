'use client'

import Link from 'next/link'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { SectionTitle } from '../shared/SectionTitle'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { ModernPostCard, type ModernHomepagePost } from './ModernPostCard'
import styles from './ModernPostsSection.module.css'

export type ModernPostsSectionProps = {
  title: string
  posts: ModernHomepagePost[]
  accentColor: string
  blogHref: string
  language: SiteLanguage
  hrefForPost: (postId: string) => string
}

const MAX_HOMEPAGE_POSTS = 3

/**
 * Modern-theme homepage "recent posts" teaser — sits between RecentPhotos
 * and Packages, same slot as ClassicPostsSection.tsx. Ports the `modern`
 * branch of generateHomepagePostsSectionHTML (lib/homepage-posts-section.ts),
 * whose header is genuinely LTR/left-aligned here (unlike classic's, which
 * is LTR for a different, quirkier reason — see ClassicPostsSection.module.css).
 */
export function ModernPostsSection({
  title,
  posts,
  accentColor,
  blogHref,
  language,
  hrefForPost,
}: ModernPostsSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  // Matches the old renderer: generateHomepagePostsSectionHTML returns ''
  // when there are no posts at all.
  if (posts.length === 0) return null

  const copy = getSiteChromeCopy(language)
  const arrow = galleryCardArrow(language)
  const display = posts.slice(0, MAX_HOMEPAGE_POSTS)

  return (
    <section ref={ref} className={`${styles.section} stagger-reveal ${revealed ? 'is-visible' : ''}`}>
      <div className={styles.header} style={{ '--modern-accent': accentColor } as React.CSSProperties}>
        <div className={styles.headerTitles}>
          <ModernSectionEyebrow>BLOG</ModernSectionEyebrow>
          <SectionTitle color="#0f172a" className={styles.title}>
            {title}
          </SectionTitle>
        </div>
        <div className={styles.more}>
          <Link href={blogHref} className={styles.moreLink} style={{ color: accentColor }}>
            {copy.viewAllPosts}
            <span className={styles.moreArrow} aria-hidden="true">
              {arrow}
            </span>
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        {display.map((post) => (
          <ModernPostCard key={post.id} post={post} href={hrefForPost(post.id)} accentColor={accentColor} />
        ))}
      </div>
    </section>
  )
}
