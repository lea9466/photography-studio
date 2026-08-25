import { ElegantBlogPostCard, type ElegantBlogPostCardItem } from './ElegantBlogPostCard'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './ElegantBlogListPage.module.css'
import './elegant-theme.css'

export type { ElegantBlogPostCardItem }

function blogListCopy(language: SiteLanguage) {
  return {
    // eyebrowLabel() (lib/public-blog-html.ts) has no elegant-specific case —
    // it falls to the function's default return value, a literal English
    // string never translated by site language.
    eyebrow: 'Journal',
    empty: language === 'en' ? 'No posts yet.' : 'עדיין אין פוסטים.',
  }
}

export type ElegantBlogListPageProps = {
  accentColor: string
  language: SiteLanguage

  pageTitle: string
  posts: ElegantBlogPostCardItem[]
  hrefForPost: (postId: string) => string
}

/**
 * Elegant-theme blog list page — 1:1 port of blogBody() (lib/public-blog-html.ts
 * ~line 1099): a "Journal" eyebrow, a Frank Ruhl Libre bold-ish (font-medium)
 * title, a divider bar, then a responsive 1/2/3-column card grid (or the
 * empty-state message when there are no posts yet). Same deferrals as
 * Classic/Dark/ModernBlogListPage.tsx — no `circles` display style, no
 * quick-preview modal.
 */
export function ElegantBlogListPage(props: ElegantBlogListPageProps) {
  const { accentColor, language, pageTitle, posts, hrefForPost } = props

  const copy = blogListCopy(language)

  return (
    <>
      <main className={styles.main}>
        <section className={styles.section}>
          <header className={styles.header}>
            <span className={styles.eyebrow} style={{ color: accentColor }}>
              {copy.eyebrow}
            </span>
            <h1 className={styles.title}>{pageTitle}</h1>
            <div className={styles.divider} style={{ backgroundColor: accentColor }} />
          </header>

          {posts.length > 0 ? (
            <div className={styles.grid}>
              {posts.map((post) => (
                <ElegantBlogPostCard
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
    </>
  )
}
