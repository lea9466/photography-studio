'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ElegantBlogShareLinks } from './ElegantBlogShareLinks'
import type { SiteLanguage } from '@/lib/site-language'
import { isSiteLtr } from '@/lib/site-language'
import styles from './ElegantBlogPostPage.module.css'
import './elegant-theme.css'

function postNavCopy(language: SiteLanguage) {
  return {
    previousPost: language === 'en' ? 'Previous post' : 'הפוסט הקודם',
    nextPost: language === 'en' ? 'Next post' : 'הפוסט הבא',
    postNavigation: language === 'en' ? 'Post navigation' : 'ניווט בין פוסטים',
  }
}

/** Local prop shape — mirrors Classic/Dark/ModernBlogPostPageItem; see those
 * types' doc comments for why `content` renders as plain JSX text (never
 * dangerouslySetInnerHTML) with a `white-space: pre-line` CSS trick instead
 * of real markup — posts.content is a plain free-text column, not
 * rich/WYSIWYG HTML, and there's no sanitize-html/DOMPurify step anywhere in
 * this repo that would make treating it as trusted markup safe. */
export type ElegantBlogPostPageItem = {
  id: string
  title: string
  subtitle: string | null
  content: string
  date: string
  coverUrl: string | null
  images: string[]
}

export type ElegantBlogPostNavItem = {
  id: string
  title: string
  coverUrl: string | null
  href: string
}

export type ElegantBlogPostPageProps = {
  accentColor: string
  language: SiteLanguage

  post: ElegantBlogPostPageItem
  /** This post's own canonical path, e.g. "/studio/blog/abc123" — used to
   * build the share links' absolute URL client-side (window.location.origin
   * isn't available during SSR). */
  postPath: string
  prevPost: ElegantBlogPostNavItem | null
  nextPost: ElegantBlogPostNavItem | null
}

/**
 * Elegant-theme single blog post page — same shape as
 * Classic/Dark/ModernBlogPostPage.tsx (full-bleed cover hero with the title
 * overlaid at the bottom when there's a cover image, or a centered
 * title/subtitle header when there isn't; date, share row, body content,
 * extra post images, then a prev/next post nav), restyled with elegant's own
 * tokens. See ElegantBlogPostPage.module.css's doc comment: elegant's hero
 * takes the GENERIC (non-dark) branch of blogPostHeroThemeCss() — same shape
 * as classic's, not dark's desaturated/longer-fade treatment.
 */
export function ElegantBlogPostPage(props: ElegantBlogPostPageProps) {
  const { accentColor, language, post, postPath, prevPost, nextPost } = props

  const navCopy = postNavCopy(language)
  const contentDir = isSiteLtr(language) ? 'ltr' : 'rtl'
  const hasCover = Boolean(post.coverUrl)

  // Same-origin-relative until mount, then upgraded to an absolute URL —
  // avoids depending on `window` during SSR while still matching on first
  // client render (no hydration mismatch, since the relative path is valid
  // markup either way). Mirrors Classic/Dark/ModernBlogPostPage.tsx.
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
          <article>
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
              <ElegantBlogShareLinks
                shareUrl={shareUrl}
                postTitle={post.title}
                accentColor={accentColor}
                language={language}
              />
              <div className={styles.divider} style={{ backgroundColor: accentColor }} />
            </header>
            {/* Plain text, not markup — see ElegantBlogPostPageItem's doc comment above. */}
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
