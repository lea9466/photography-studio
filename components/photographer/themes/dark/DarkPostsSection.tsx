'use client'

import Link from 'next/link'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { DarkSectionEyebrow } from './DarkSectionEyebrow'
import { HomepageBlogCard, type HomepageBlogCardPost } from '../shared/HomepageBlogCard'
import { BlogCirclesGrid } from '../shared/BlogCirclesGrid'

/** Kept as a re-export so DarkHomePage's `posts` prop type doesn't move. */
export type DarkHomepagePost = HomepageBlogCardPost
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
import styles from './DarkPostsSection.module.css'

export type DarkPostsSectionProps = {
  title: string
  posts: DarkHomepagePost[]
  displayStyle: PostsDisplayStyle
  accentColor: string
  blogHref: string
  language: SiteLanguage
  hrefForPost: (postId: string) => string
}

const MAX_HOMEPAGE_POSTS = 4

/**
 * Dark theme's homepage "recent posts" teaser — 1:1 port of
 * generateHomepagePostsSectionHTML's `isDark` branch
 * (lib/homepage-posts-section.ts) — sits between RecentPhotos and Packages,
 * same as every other theme. LTR-header override (`.hp-posts-header--bold`)
 * matches the same reasoning as DarkGalleriesSection/DarkRecentPhotosSection
 * — no divider element in the source markup.
 */
export function DarkPostsSection({
  title,
  posts,
  displayStyle,
  accentColor,
  blogHref,
  language,
  hrefForPost,
}: DarkPostsSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()

  // Matches the old renderer: generateHomepagePostsSectionHTML returns ''
  // when there are no posts at all.
  if (posts.length === 0) return null

  const copy = getSiteChromeCopy(language)
  const arrow = galleryCardArrow(language)
  const display = posts.slice(0, MAX_HOMEPAGE_POSTS)

  return (
    <section ref={ref} className={`${styles.section} reveal ${revealed ? 'active' : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerTitles}>
          <DarkSectionEyebrow accentColor={accentColor}>BLOG</DarkSectionEyebrow>
          <h2 className={styles.title}>{title}</h2>
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
              tone="dark"
            />
          ))}
        </div>
      )}
    </section>
  )
}
