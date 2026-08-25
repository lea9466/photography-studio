'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DarkBlogShareLinks } from './DarkBlogShareLinks'
import type { SiteLanguage } from '@/lib/site-language'
import { isSiteLtr } from '@/lib/site-language'
import styles from './DarkBlogPostPage.module.css'
import './dark-theme.css'

function postNavCopy(language: SiteLanguage) {
  return {
    previousPost: language === 'en' ? 'Previous post' : 'הפוסט הקודם',
    nextPost: language === 'en' ? 'Next post' : 'הפוסט הבא',
    postNavigation: language === 'en' ? 'Post navigation' : 'ניווט בין פוסטים',
  }
}

/** Local prop shape — mirrors ClassicBlogPostPageItem/ModernBlogPostPageItem;
 * see those types' doc comments for why `content` renders as plain JSX text
 * (never dangerouslySetInnerHTML) with a `white-space: pre-line` CSS trick
 * instead of real markup — posts.content is a plain free-text column, not
 * rich/WYSIWYG HTML, and there's no sanitize-html/DOMPurify step anywhere in
 * this repo that would make treating it as trusted markup safe. */
export type DarkBlogPostPageItem = {
  id: string
  title: string
  subtitle: string | null
  content: string
  date: string
  coverUrl: string | null
  images: string[]
}

export type DarkBlogPostNavItem = {
  id: string
  title: string
  coverUrl: string | null
  href: string
}

export type DarkBlogPostPageProps = {
  accentColor: string
  language: SiteLanguage

  post: DarkBlogPostPageItem
  /** This post's own canonical path, e.g. "/studio/blog/abc123" — used to
   * build the share links' absolute URL client-side (window.location.origin
   * isn't available during SSR). */
  postPath: string
  prevPost: DarkBlogPostNavItem | null
  nextPost: DarkBlogPostNavItem | null
}

/**
 * Dark-theme single blog post page — same shape as
 * Classic/ModernBlogPostPage.tsx (full-bleed cover hero with the title
 * overlaid at the bottom when there's a cover image, or a centered
 * title/subtitle header when there isn't; date, share row, body content,
 * extra post images, then a prev/next post nav), restyled with dark's own
 * tokens. The hero specifically has dark-only treatment ported from
 * blogPostHeroThemeCss()'s `dark` branch (lib/public-blog-html.ts): the cover
 * image is desaturated/dimmed (`saturate(0.9) brightness(0.94)
 * contrast(0.98)`), the overlay is a light wash (`rgba(255,255,255,0.24)`,
 * not classic/modern's near-identical value — dark's is meaningfully
 * lighter) instead of white, the bottom fade blends through dark's own
 * `#121217` bg via a longer multi-stop gradient, and the content pulls up
 * -40px under the hero instead of -32px.
 *
 * Header/Footer are no longer rendered here — see
 * `app/dev-preview/dark/layout.tsx`'s doc comment for why (single persistent
 * chrome instance across every dark preview route instead of a fresh one per
 * page).
 */
export function DarkBlogPostPage(props: DarkBlogPostPageProps) {
  const { accentColor, language, post, postPath, prevPost, nextPost } = props

  const navCopy = postNavCopy(language)
  const contentDir = isSiteLtr(language) ? 'ltr' : 'rtl'
  const hasCover = Boolean(post.coverUrl)

  // Same-origin-relative until mount, then upgraded to an absolute URL —
  // avoids depending on `window` during SSR while still matching on first
  // client render (no hydration mismatch, since the relative path is valid
  // markup either way). Mirrors Classic/ModernBlogPostPage.tsx.
  const [shareUrl, setShareUrl] = useState(postPath)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}${postPath}`)
    }
  }, [postPath])

  return (
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
              <DarkBlogShareLinks
                shareUrl={shareUrl}
                postTitle={post.title}
                accentColor={accentColor}
                language={language}
              />
              <div className={styles.divider} style={{ backgroundColor: accentColor }} />
            </header>
            {/* Plain text, not markup — see DarkBlogPostPageItem's doc comment above. */}
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
  )
}
