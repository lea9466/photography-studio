import { SectionTitle } from '../shared/SectionTitle'
import { ModernSectionEyebrow } from './ModernSectionEyebrow'
import { ModernBlogPostCard, type ModernBlogPostCardItem } from './ModernBlogPostCard'
import type { SiteLanguage } from '@/lib/site-language'
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
  posts: ModernBlogPostCardItem[]
  hrefForPost: (postId: string) => string
}

/**
 * Modern-theme blog list page — same shape as ClassicBlogListPage.tsx
 * (centered header, responsive 1/2/3-column card grid or empty-state
 * message), with modern's own eyebrow+title header instead of classic's
 * cursive ClassicSectionScript. Same deferrals as ClassicBlogListPage.tsx —
 * see that component's doc comment (no `circles` display style, no
 * quick-preview modal).
 */
export function ModernBlogListPage(props: ModernBlogListPageProps) {
  const {
    accentColor,
    language,
    pageTitle,
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

        {posts.length > 0 ? (
          <div className={styles.grid}>
            {posts.map((post) => (
              <ModernBlogPostCard
                key={post.id}
                post={post}
                href={hrefForPost(post.id)}
                accentColor={accentColor}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>{copy.empty}</p>
        )}
      </section>
    </main>
  )
}
