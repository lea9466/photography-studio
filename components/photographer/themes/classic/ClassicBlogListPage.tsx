import { ClassicSectionScript } from './ClassicSectionScript'
import { ClassicBlogPostCard, type ClassicBlogPostCardItem } from './ClassicBlogPostCard'
import type { SiteLanguage } from '@/lib/site-language'
import styles from './ClassicBlogListPage.module.css'
import './classic-theme.css'

function blogListCopy(language: SiteLanguage) {
  return {
    empty: language === 'en' ? 'No posts yet.' : 'עדיין אין פוסטים.',
  }
}

export type ClassicBlogListPageProps = {
  accentColor: string
  language: SiteLanguage

  pageTitle: string
  posts: ClassicBlogPostCardItem[]
  hrefForPost: (postId: string) => string
}

/**
 * Classic-theme blog list page — 1:1 port of blogBody()'s classic branch
 * (lib/public-blog-html.ts line ~1099): centered eyebrow + title + underline
 * header, then a responsive 1/2/3-column card grid (or the empty-state
 * message when there are no posts yet).
 *
 * Deferred (not built here):
 *  - `posts_display_style === 'circles'` — the alternate editorial "circles"
 *    grid (blog-grid--circles / .blog-card--circle). Classic's real default
 *    is 'cards' (normalizePostsDisplayStyle), which is what this ports.
 *  - The hover/focus "quick preview" peek button + in-page modal
 *    (BLOG_MODAL_INIT_SCRIPT) that let the old renderer preview a post
 *    without navigating — cards here always link straight to the real post
 *    page instead.
 */
export function ClassicBlogListPage(props: ClassicBlogListPageProps) {
  const { accentColor, language, pageTitle, posts, hrefForPost } = props

  const copy = blogListCopy(language)

  return (
    <>
      <main className={styles.main}>
        <section className={styles.section}>
          <header className={styles.header}>
            <ClassicSectionScript color={accentColor}>Stories</ClassicSectionScript>
            <h1 className={styles.title}>{pageTitle}</h1>
            <div className={styles.divider} style={{ backgroundColor: accentColor }} />
          </header>

          {posts.length > 0 ? (
            <div className={styles.grid}>
              {posts.map((post) => (
                <ClassicBlogPostCard
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
