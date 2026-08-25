import { DarkBlogPostCard, type DarkBlogPostCardItem } from './DarkBlogPostCard'
import { BlogCirclesGrid } from '../shared/BlogCirclesGrid'
import type { SiteLanguage } from '@/lib/site-language'
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
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
  displayStyle: PostsDisplayStyle
  posts: DarkBlogPostCardItem[]
  hrefForPost: (postId: string) => string
}

/**
 * Dark-theme blog list page — 1:1 port of blogBody() (lib/public-blog-html.ts
 * ~line 1099): a plain uppercase "JOURNAL" eyebrow (eyebrowLabel('dark') —
 * NOT DarkSectionEyebrow's hollow-stroke homepage treatment, same "plainer
 * label on subsidiary pages" convention as DarkPortfolioHeader.tsx), a Space
 * Grotesk bold title, then either the regular card grid or
 * (displayStyle === 'circles') the shared BlogCirclesGrid — see that
 * component's doc comment for why "circles" is one component shared by all
 * 4 themes. No quick-preview modal, same as the card grid.
 *
 * Header/Footer are no longer rendered here — see
 * `app/dev-preview/dark/layout.tsx`'s doc comment for why (single persistent
 * chrome instance across every dark preview route instead of a fresh one per
 * page).
 */
export function DarkBlogListPage(props: DarkBlogListPageProps) {
  const { accentColor, language, pageTitle, displayStyle, posts, hrefForPost } = props

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

          {posts.length === 0 ? (
            <p className={styles.empty}>{copy.empty}</p>
          ) : displayStyle === 'circles' ? (
            <BlogCirclesGrid
              posts={posts.map((post) => ({ ...post, href: hrefForPost(post.id) }))}
              accentColor={accentColor}
              language={language}
            />
          ) : (
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
          )}
        </section>
    </main>
  )
}
