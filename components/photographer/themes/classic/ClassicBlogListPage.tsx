import { ClassicSectionScript } from './ClassicSectionScript'
import { ClassicBlogPostCard, type ClassicBlogPostCardItem } from './ClassicBlogPostCard'
import { BlogCirclesGrid } from '../shared/BlogCirclesGrid'
import type { SiteLanguage } from '@/lib/site-language'
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
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
  displayStyle: PostsDisplayStyle
  posts: ClassicBlogPostCardItem[]
  hrefForPost: (postId: string) => string
}

/**
 * Classic-theme blog list page — 1:1 port of blogBody()'s classic branch
 * (lib/public-blog-html.ts line ~1099): centered eyebrow + title + underline
 * header, then either the regular card grid or (displayStyle === 'circles')
 * the shared BlogCirclesGrid — see that component's doc comment for why
 * "circles" is one component shared by all 4 themes instead of ported once
 * per theme like the card grid is.
 *
 * Not ported (same simplification the card grid already made): the
 * hover/focus "quick preview" peek button + in-page modal
 * (BLOG_MODAL_INIT_SCRIPT) — cards/circles here always link straight to the
 * real post page instead.
 */
export function ClassicBlogListPage(props: ClassicBlogListPageProps) {
  const { accentColor, language, pageTitle, displayStyle, posts, hrefForPost } = props

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

          {posts.length === 0 ? (
            <p className={styles.empty}>{copy.empty}</p>
          ) : displayStyle === 'circles' ? (
            <BlogCirclesGrid posts={posts} accentColor={accentColor} language={language} hrefForPost={hrefForPost} />
          ) : (
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
          )}
        </section>
      </main>
    </>
  )
}
