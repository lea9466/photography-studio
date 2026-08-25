import { DarkBlogPostCard, type DarkBlogPostCardItem } from './DarkBlogPostCard'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './DarkBlogListPage.module.css'
import './dark-theme.css'

export type { DarkBlogPostCardItem }

function blogListCopy(language: SiteLanguage) {
  return {
    eyebrow: language === 'en' ? 'JOURNAL' : 'JOURNAL',
    empty: language === 'en' ? 'No posts yet.' : 'עדיין אין פוסטים.',
  }
}

export type DarkBlogListPageProps = {
  accentColor: string
  language: SiteLanguage

  pageTitle: string
  posts: DarkBlogPostCardItem[]
  hrefForPost: (postId: string) => string
}

/**
 * Dark-theme blog list page — 1:1 port of blogBody() (lib/public-blog-html.ts
 * ~line 1099): a plain uppercase "JOURNAL" eyebrow (eyebrowLabel('dark') —
 * NOT DarkSectionEyebrow's hollow-stroke homepage treatment, same "plainer
 * label on subsidiary pages" convention as DarkPortfolioHeader.tsx), a Space
 * Grotesk bold title, then a responsive 1/2/3-column card grid (or the
 * empty-state message when there are no posts yet). Same deferrals as
 * Classic/ModernBlogListPage.tsx — no `circles` display style, no
 * quick-preview modal.
 *
 * Header/Footer are no longer rendered here — see
 * `app/dev-preview/dark/layout.tsx`'s doc comment for why (single persistent
 * chrome instance across every dark preview route instead of a fresh one per
 * page).
 */
export function DarkBlogListPage(props: DarkBlogListPageProps) {
  const { accentColor, language, pageTitle, posts, hrefForPost } = props

  const copy = blogListCopy(language)

  return (
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
                <DarkBlogPostCard
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
