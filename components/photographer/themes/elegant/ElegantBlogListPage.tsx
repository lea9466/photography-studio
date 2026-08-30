import { type ElegantBlogPostCardItem } from './ElegantBlogPostCard'
import { HomepageBlogCard } from '../shared/HomepageBlogCard'
import { BlogCirclesGrid } from '../shared/BlogCirclesGrid'
import type { SiteLanguage } from '@/lib/site-language'
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
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
  displayStyle: PostsDisplayStyle
  posts: ElegantBlogPostCardItem[]
  hrefForPost: (postId: string) => string
}

/**
 * Elegant-theme blog list page — 1:1 port of blogBody() (lib/public-blog-html.ts
 * ~line 1099): a "Journal" eyebrow, a Frank Ruhl Libre bold-ish (font-medium)
 * title, a divider bar, then either the regular card grid or
 * (displayStyle === 'circles') the shared BlogCirclesGrid — see that
 * component's doc comment for why "circles" is one component shared by all
 * 4 themes. No quick-preview modal, same as the card grid.
 */
export function ElegantBlogListPage(props: ElegantBlogListPageProps) {
  const { accentColor, language, pageTitle, displayStyle, posts, hrefForPost } = props

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
    </>
  )
}
