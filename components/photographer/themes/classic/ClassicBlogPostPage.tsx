'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClassicBlogShareLinks } from './ClassicBlogShareLinks'
import type { SiteLanguage } from '@/lib/site-language'
import { isSiteLtr } from '@/lib/site-language'
import styles from './ClassicBlogPostPage.module.css'
import './classic-theme.css'

function postNavCopy(language: SiteLanguage) {
  return {
    previousPost: language === 'en' ? 'Previous post' : 'הפוסט הקודם',
    nextPost: language === 'en' ? 'Next post' : 'הפוסט הבא',
    postNavigation: language === 'en' ? 'Post navigation' : 'ניווט בין פוסטים',
  }
}

/** Local prop shape — mirrors the fields generateBlogPostContent()/
 * blogPostPageBody() actually read off a mapped `PublicBlogPost` row
 * (lib/public-blog-html.ts), camelCased.
 *
 * `content` is the post body: a plain free-text field edited through a plain
 * `<Textarea>` in the dashboard (components/dashboard/PostsManager.tsx) and
 * stored as-is in the `posts.content` column — NOT rich/WYSIWYG HTML. The
 * old string-HTML renderer itself confirms this: generateBlogPostContent()
 * runs it through escapeHtml() before ever writing it into markup, and
 * relies on CSS `white-space: pre-line` (not real markup) to turn the
 * author's line breaks into paragraphs. There is no sanitize-html/DOMPurify
 * step anywhere in this repo, which would be required before this could
 * ever be treated as trusted markup. So it's rendered here as plain JSX text
 * (React escapes it automatically) with the same `white-space: pre-line`
 * CSS trick — never `dangerouslySetInnerHTML`. */
export type ClassicBlogPostPageItem = {
  id: string
  title: string
  subtitle: string | null
  content: string
  date: string
  coverUrl: string | null
  images: string[]
}

export type ClassicBlogPostNavItem = {
  id: string
  title: string
  coverUrl: string | null
  href: string
}

export type ClassicBlogPostPageProps = {
  accentColor: string
  language: SiteLanguage

  post: ClassicBlogPostPageItem
  /** This post's own canonical path, e.g. "/studio/blog/abc123" — used to
   * build the share links' absolute URL client-side (window.location.origin
   * isn't available during SSR). */
  postPath: string
  prevPost: ClassicBlogPostNavItem | null
  nextPost: ClassicBlogPostNavItem | null
}

/**
 * Classic-theme single blog post page — 1:1 port of blogPostPageBody() +
 * generateBlogPostContent() (lib/public-blog-html.ts line ~1396/977),
 * classic (non-dark) branch only: full-bleed cover hero with the title
 * overlaid at the bottom (when there's a cover image), or a centered
 * title/subtitle header (when there isn't); date, share row, body content,
 * any extra post images below the body, then a prev/next post nav.
 */
export function ClassicBlogPostPage(props: ClassicBlogPostPageProps) {
  const { accentColor, language, post, postPath, prevPost, nextPost } = props

  const navCopy = postNavCopy(language)
  const contentDir = isSiteLtr(language) ? 'ltr' : 'rtl'
  const hasCover = Boolean(post.coverUrl)

  // Same-origin-relative until mount, then upgraded to an absolute URL —
  // avoids depending on `window` during SSR while still matching on first
  // client render (no hydration mismatch, since the relative path is valid
  // markup either way).
  const [shareUrl, setShareUrl] = useState(postPath)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}${postPath}`)
    }
  }, [postPath])

  return (
    <>
      <main className={hasCover ? styles.mainWithHero : styles.mainNoHero}>
        {hasCover ? (
          <div className={styles.hero}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.heroImg} src={post.coverUrl as string} alt={post.title} />
            <div className={styles.heroOverlay} aria-hidden="true" />
            <div className={styles.heroFade} aria-hidden="true" />
            <div className={styles.heroCaption}>
              <h1 className={styles.heroTitle}>{post.title}</h1>
              {post.subtitle ? <p className={styles.heroSubtitle}>{post.subtitle}</p> : null}
            </div>
          </div>
        ) : null}

        <section className={styles.content} dir={contentDir}>
          <article className={styles.article}>
            <header>
              {!hasCover ? (
                <>
                  <h1 className={styles.title}>{post.title}</h1>
                  {post.subtitle ? <p className={styles.subtitle}>{post.subtitle}</p> : null}
                </>
              ) : null}
              <p className={styles.date} style={{ color: accentColor }}>
                {post.date}
              </p>
              <ClassicBlogShareLinks
                shareUrl={shareUrl}
                postTitle={post.title}
                accentColor={accentColor}
                language={language}
              />
              <div className={styles.divider} style={{ backgroundColor: accentColor }} />
            </header>
            {/* Plain text, not markup — see the `content` field note on
                ClassicBlogPostPageItem above. */}
            <div className={styles.body}>{post.content}</div>
            {post.images.length > 0 ? (
              <div className={styles.images}>
                {post.images.map((url, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={index} className={styles.image} src={url} alt={post.title} loading="lazy" />
                ))}
              </div>
            ) : null}
          </article>

          {prevPost || nextPost ? (
            <nav className={styles.postNav} aria-label={navCopy.postNavigation}>
              {prevPost ? (
                <Link href={prevPost.href} className={`${styles.navItem} ${styles.navItemPrev}`}>
                  <div className={styles.navThumb}>
                    {prevPost.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.navThumbImg} src={prevPost.coverUrl} alt="" loading="lazy" />
                    ) : null}
                  </div>
                  <div>
                    <div className={styles.navLabel} style={{ color: accentColor }}>
                      {navCopy.previousPost}
                    </div>
                    <div className={styles.navTitle}>{prevPost.title}</div>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {nextPost ? (
                <Link href={nextPost.href} className={`${styles.navItem} ${styles.navItemNext}`}>
                  <div className={styles.navThumb}>
                    {nextPost.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.navThumbImg} src={nextPost.coverUrl} alt="" loading="lazy" />
                    ) : null}
                  </div>
                  <div>
                    <div className={styles.navLabel} style={{ color: accentColor }}>
                      {navCopy.nextPost}
                    </div>
                    <div className={styles.navTitle}>{nextPost.title}</div>
                  </div>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          ) : null}
        </section>
      </main>
    </>
  )
}
