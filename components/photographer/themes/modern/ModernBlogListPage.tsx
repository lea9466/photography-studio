import { SectionTitle } from '../shared/SectionTitle'
import { BlogCirclesGrid } from '../shared/BlogCirclesGrid'
import { HomepageBlogCard } from '../shared/HomepageBlogCard'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { type ModernBlogPostCardItem } from './ModernBlogPostCard'
import type { SiteLanguage } from '@/lib/site-language'
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
import styles from './ModernBlogListPage.module.css'
import './modern-theme.css'

function blogListCopy(language: SiteLanguage) {
  return {
    empty: language === 'en' ? 'No posts yet.' : 'עדיין אין פוסטים.',
  }
}

export type ModernBlogListPageProps = {
  /** studioName/logoUrl/shouldColorLogo/homepagePath/blogPath/beforeAfterPath/
   * portfolioPath/galleryLayoutMode/hasFaq/hasPackages were header/footer-only
   * and moved to the shared app/dev-preview/modern/layout.tsx that now
   * renders ModernSiteHeader/ModernSiteFooter around this page. */
  accentColor: string
  language: SiteLanguage

  pageTitle: string
  displayStyle: PostsDisplayStyle
  posts: ModernBlogPostCardItem[]
  hrefForPost: (postId: string) => string
}

/**
 * Modern-theme blog list page — same shape as ClassicBlogListPage.tsx
 * (centered header, either the regular card grid or, when
 * displayStyle === 'circles', the shared BlogCirclesGrid — see that
 * component's doc comment for why "circles" is one component shared by all
 * 4 themes), with modern's own eyebrow+title header instead of classic's
 * cursive ClassicSectionScript. No quick-preview modal, same as the card grid.
 */
export function ModernBlogListPage(props: ModernBlogListPageProps) {
  const {
    accentColor,
    language,
    pageTitle,
    displayStyle,
    posts,
    hrefForPost,
  } = props

  const copy = blogListCopy(language)

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <header className={styles.header} style={{ '--modern-accent': accentColor } as React.CSSProperties}>
          <ModernSectionEyebrow align="center">BLOG</ModernSectionEyebrow>
          <SectionTitle color="#0f172a" className={styles.title} style={{ textAlign: 'center' }}>
            {pageTitle}
          </SectionTitle>
          <div className={styles.divider} style={{ backgroundColor: accentColor }} />
        </header>

        {posts.length === 0 ? (
          <p className={styles.empty}>{copy.empty}</p>
        ) : displayStyle === 'circles' ? (
          <BlogCirclesGrid
            posts={posts.map((post) => ({ ...post, href: hrefForPost(post.id) }))}
            accentColor={accentColor}
            language={language}
          />
        ) : (
          <div className={styles.grid} data-count={posts.length}>
            {posts.map((post, index) => (
              <HomepageBlogCard
                key={post.id}
                post={{
                  id: post.id,
                  title: post.title,
                  date: post.date,
                  coverUrl: post.coverUrl,
                  content: post.excerpt,
                }}
                href={hrefForPost(post.id)}
                accentColor={accentColor}
                index={index}
                total={posts.length}
                language={language}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
