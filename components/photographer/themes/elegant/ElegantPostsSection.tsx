'use client'

import Link from 'next/link'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ElegantSectionHeading } from './ElegantSectionHeading'
import { HomepageBlogCard, type HomepageBlogCardPost } from '../shared/HomepageBlogCard'
import { BlogCirclesGrid } from '../shared/BlogCirclesGrid'

/** Kept as a re-export so ElegantHomePage's `posts` prop type doesn't move. */
export type ElegantHomepagePost = HomepageBlogCardPost
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
import styles from './ElegantPostsSection.module.css'

export type ElegantPostsSectionProps = {
  title: string
  posts: ElegantHomepagePost[]
  displayStyle: PostsDisplayStyle
  accentColor: string
  blogHref: string
  language: SiteLanguage
  hrefForPost: (postId: string) => string
}

const MAX_HOMEPAGE_POSTS = 4

/**
 * Elegant theme's homepage "recent posts" teaser — 1:1 port of
 * generateHomepagePostsSectionHTML's `isElegant` branch
 * (lib/homepage-posts-section.ts, ELEGANT_HOMEPAGE_POSTS_CSS): `<section
 * class="hp-posts-section" id="posts">` itself carries no reveal class —
 * only the header (`stagger-reveal`) and each card
 * (`stagger-reveal`, staggered by `index * 180`ms) fade in, via
 * `useRevealOnScroll`/`.theme-elegant .stagger-reveal.is-visible`
 * (elegant-theme.css) rather than a section-wide reveal. Header is genuinely
 * LTR/flush-left here (`.hp-posts-header--elegant`), matching
 * ElegantSectionHeading's `align="start"` — no divider element in the source
 * markup, just the watermark+title stack and (when present) the "view all
 * posts" link on the trailing side of the same row.
 */
export function ElegantPostsSection({
  title,
  posts,
  displayStyle,
  accentColor,
  blogHref,
  language,
  hrefForPost,
}: ElegantPostsSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>()

  // Matches the old renderer: generateHomepagePostsSectionHTML returns ''
  // when there are no posts at all.
  if (posts.length === 0) return null

  const copy = getSiteChromeCopy(language)
  const arrow = galleryCardArrow(language)
  const display = posts.slice(0, MAX_HOMEPAGE_POSTS)

  return (
    <section className={styles.section} id="posts">
      <div ref={ref} className={`${styles.header} stagger-reveal ${revealed ? 'is-visible' : ''}`}>
        <div className={styles.headerTitles}>
          <ElegantSectionHeading title={title} watermark="BLOG" accentColor={accentColor} align="start" />
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

      {displayStyle === 'circles' ? (
        <BlogCirclesGrid
          posts={display.map((post) => ({ ...post, excerpt: post.content, href: hrefForPost(post.id) }))}
          accentColor={accentColor}
          language={language}
          columns={4}
        />
      ) : (
        <div className={styles.grid} data-count={display.length}>
          {display.map((post, index) => (
            <HomepageBlogCard
              key={post.id}
              post={post}
              href={hrefForPost(post.id)}
              accentColor={accentColor}
              index={index}
              total={display.length}
              language={language}
            />
          ))}
        </div>
      )}
    </section>
  )
}
