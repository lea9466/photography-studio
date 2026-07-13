import type { SiteChromeTheme } from '@/lib/photographer-site-chrome'
import { galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'
import {
  HOMEPAGE_STAGGER_REVEAL_CSS,
} from '@/lib/homepage-stagger-reveal'
import {
  BLOG_MODAL_CSS,
  BLOG_MODAL_INIT_SCRIPT,
  generateBlogModalMarkup,
  generateBlogPostDetailTemplates,
  getBlogThemeTokens,
  type PublicBlogPost,
} from '@/lib/public-blog-html'

type SectionTokens = {
  cardBg: string
  text: string
  variant: string
  cardRadius: string
  cardBorder: string
  titleFont: string
  eyebrow: string
}

const TOKENS: Record<SiteChromeTheme, SectionTokens> = {
  elegant: {
    cardBg: '#fdf8f7',
    text: '#1c1b1b',
    variant: '#464742',
    cardRadius: '0px',
    cardBorder: '1px solid rgba(0,0,0,0.06)',
    titleFont: "'Frank Ruhl Libre', serif",
    eyebrow: 'Journal',
  },
  classic: {
    cardBg: '#ffffff',
    text: '#1c1917',
    variant: '#57534e',
    cardRadius: '4px',
    cardBorder: '1px solid rgba(0,0,0,0.06)',
    titleFont: "'Frank Ruhl Libre', serif",
    eyebrow: 'Stories',
  },
  modern: {
    cardBg: '#ffffff',
    text: '#0F172A',
    variant: '#475569',
    cardRadius: '12px',
    cardBorder: '1px solid #e2e8f0',
    titleFont: "'Space Grotesk', 'Heebo', sans-serif",
    eyebrow: 'BLOG',
  },
  dark: {
    cardBg: '#1A1A22',
    text: '#F5F5F0',
    variant: '#B8B8C0',
    cardRadius: '2px',
    cardBorder: '1px solid rgba(255,255,255,0.06)',
    titleFont: "'Space Grotesk', 'Heebo', sans-serif",
    eyebrow: 'JOURNAL',
  },
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export const HOMEPAGE_MORE_LINK_CSS = `
.hp-posts-more {
  display: flex;
  justify-content: flex-start;
  margin-top: 28px;
}
.hp-posts-more a {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-decoration: none;
  border: none;
  padding: 0;
  background: none;
  transition: opacity 0.2s ease, transform 0.15s ease;
}
.hp-posts-more a:hover { opacity: 0.75; }
.hp-posts-more a:active { transform: scale(0.96); }
.hp-posts-more a:hover .hp-posts-more-arrow { transform: translateX(-5px); }
.hp-posts-more-arrow {
  display: inline-block;
  font-size: 1.05em;
  line-height: 1;
  transition: transform 0.3s ease;
}
`

export function generateHomepageMoreLinkHTML(options: {
  href: string
  label: string
  primaryColor: string
  includeStyles?: boolean
  language?: SiteLanguage
}): string {
  const language = options.language ?? 'he'
  const arrow = galleryCardArrow(language)
  const styles =
    options.includeStyles === false ? '' : `<style>${HOMEPAGE_MORE_LINK_CSS}</style>`
  return `${styles}
<div class="hp-posts-more">
  <a href="${escapeHtml(options.href)}" target="_parent" style="color:${options.primaryColor};">
    ${escapeHtml(options.label)}
    <span class="hp-posts-more-arrow" aria-hidden="true">${arrow}</span>
  </a>
</div>`
}

const HOMEPAGE_POSTS_CSS = `
.hp-posts-section {
  width: 100%;
  overflow: hidden;
  padding-top: calc(2.5rem + 20px);
  padding-bottom: 3rem;
  padding-inline: 0;
}
@media (min-width: 768px) {
  .hp-posts-section {
    padding-top: calc(3.5rem + 20px);
    padding-bottom: 4rem;
  }
}
.hp-posts-header {
  width: 100%;
  max-width: 100%;
  margin-inline: 0;
  margin-bottom: 40px;
  padding-inline: 2%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right !important;
  box-sizing: border-box;
}
.hp-posts-header--with-more {
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
}
.hp-posts-header__titles {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right !important;
  min-width: 0;
}
.hp-posts-header__more {
  flex-shrink: 0;
}
.hp-posts-header__more .hp-posts-more {
  margin-top: 0;
}
@media (max-width: 767px) {
  .hp-posts-header--with-more:not(.hp-posts-header--classic) {
    flex-direction: column;
    align-items: flex-end;
    gap: 1rem;
  }
}
.hp-posts-eyebrow {
  display: block;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.hp-posts-title {
  font-size: 32px;
  line-height: 1.1;
  font-weight: 500;
  margin: 0;
}
@media (min-width: 768px) { .hp-posts-title { font-size: 46px; } }
.hp-posts-divider { width: 56px; height: 1px; margin: 8px 0 0; }
.hp-posts-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 3px;
  width: 100%;
  max-width: 100%;
  margin-inline: 0;
  padding-inline: 2%;
  box-sizing: border-box;
}
@media (min-width: 640px) {
  .hp-posts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
  }
}
@media (min-width: 768px) {
  .hp-posts-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
  }
}
.hp-post-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  width: 100%;
  max-width: none;
  min-width: 0;
  height: 100%;
  margin-inline: 0;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.hp-post-card.is-visible:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(0,0,0,0.12); }
.hp-post-card:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.hp-post-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  flex: 0 0 auto;
  overflow: hidden;
  background: rgba(0,0,0,0.06);
}
.hp-post-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.7s ease;
}
.hp-post-card:hover .hp-post-media img { transform: scale(1.05); }
.hp-post-media--empty::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.12));
}
.hp-post-body {
  flex: 1 1 auto;
  padding: 20px 16px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hp-post-title { font-size: 21px; line-height: 1.25; }
.hp-post-date { font-size: 13px; letter-spacing: 0.02em; }
.hp-post-excerpt {
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.85;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-line;
  min-height: calc(1.7em * 4);
}
.hp-posts-footer {
  width: 100%;
  max-width: 100%;
  margin-inline: 0;
  padding-inline: 2%;
  padding-top: 0;
  box-sizing: border-box;
}
${HOMEPAGE_MORE_LINK_CSS}
${HOMEPAGE_STAGGER_REVEAL_CSS}
`

const CLASSIC_HOMEPAGE_POSTS_CSS = `
.theme-classic .hp-posts-section {
  width: 100%;
  max-width: 100%;
  padding-inline: 0;
  padding-bottom: clamp(2.5rem, 5vw, 4rem);
  box-sizing: border-box;
}
.theme-classic .hp-posts-header.hp-posts-header--classic {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center !important;
  width: 100%;
  max-width: 100%;
  padding-inline: 2%;
  margin-bottom: 2.5rem;
  text-align: left !important;
  direction: ltr;
  box-sizing: border-box;
}
.theme-classic .hp-posts-header__titles {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left !important;
  order: 1;
}
.theme-classic .hp-posts-header__titles .hp-posts-eyebrow,
.theme-classic .hp-posts-header__titles .hp-posts-title {
  text-align: left !important;
}
.theme-classic .hp-posts-header__more {
  order: 2;
  margin-left: auto;
  flex-shrink: 0;
}
.theme-classic .hp-posts-header__more .hp-posts-more {
  margin-top: 0;
  justify-content: flex-end;
}
.theme-classic .hp-posts-grid {
  width: 100%;
  max-width: 100%;
  margin-inline: 0;
  padding-inline: 2%;
  align-items: stretch;
  gap: 4px;
  box-sizing: border-box;
}
@media (min-width: 768px) {
  .theme-classic .hp-posts-grid {
    gap: 4px;
  }
}
.theme-classic .hp-post-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: none;
}
.theme-classic .hp-post-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  height: auto;
  flex: 0 0 auto;
  overflow: hidden;
}
.theme-classic .hp-post-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.theme-classic .hp-post-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
@media (max-width: 767px) {
  .theme-classic .hp-posts-header.hp-posts-header--classic {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 1rem;
    direction: ltr;
  }
  .theme-classic .hp-posts-header__more {
    align-self: flex-end;
    margin-left: 0;
  }
}
`

const ELEGANT_HOMEPAGE_POSTS_CSS = (primaryColor: string) => `
.hp-posts-header--elegant {
  direction: ltr;
  text-align: left !important;
  align-items: flex-end !important;
  margin-bottom: 1.25rem !important;
}
.hp-posts-header--elegant.hp-posts-header--with-more {
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
}
.hp-posts-header--elegant .hp-posts-header__titles {
  align-items: flex-start;
  text-align: left !important;
}
.hp-posts-header--elegant .elegant-section-heading {
  display: grid !important;
  width: 100%;
  max-width: 100%;
  justify-items: left !important;
  align-items: last baseline;
  text-align: left !important;
}
.hp-posts-header--elegant .elegant-section-heading__watermark,
.hp-posts-header--elegant .elegant-section-heading__title {
  grid-area: 1 / 1;
  margin: 0;
  padding: 0;
  line-height: 1;
  text-align: left !important;
  justify-self: left !important;
}
.hp-posts-header--elegant .elegant-section-heading__watermark {
  font-family: 'Heebo', sans-serif;
  font-size: clamp(1.5rem, 5.4vw, 4rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${primaryColor};
  opacity: 0.14;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}
.hp-posts-header--elegant .elegant-section-heading__title {
  position: relative;
  z-index: 1;
  font-family: 'Heebo', sans-serif;
  font-weight: 500;
  font-size: clamp(1.875rem, 4vw, 2.25rem);
  color: #1c1b1b;
  direction: rtl;
}
.hp-posts-header--elegant .hp-posts-header__more .hp-posts-more {
  justify-content: flex-end;
}
@media (max-width: 767px) {
  .hp-posts-header--elegant.hp-posts-header--with-more {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 1rem;
  }
  .hp-posts-header--elegant .hp-posts-header__more {
    align-self: flex-end;
  }
  .hp-posts-header--elegant .elegant-section-heading {
    text-align: left !important;
    justify-items: left !important;
  }
}
`

function postCard(post: PublicBlogPost, t: SectionTokens, primaryColor: string, index: number): string {
  const cover = post.coverUrl || post.images[0] || null
  const media = cover
    ? `<div class="hp-post-media"><img src="${escapeHtml(cover)}" alt="${escapeHtml(post.title)}" loading="lazy" /></div>`
    : `<div class="hp-post-media hp-post-media--empty"></div>`

  return `
<article class="hp-post-card stagger-reveal" data-reveal-delay="${index * 90}" data-post-id="${escapeHtml(post.id)}" role="button" tabindex="0" style="background:${t.cardBg};color:${t.text};border-radius:${t.cardRadius};border:${t.cardBorder};">
  ${media}
  <div class="hp-post-body">
    <h3 class="hp-post-title" style="font-family:${t.titleFont};">${escapeHtml(post.title)}</h3>
    <p class="hp-post-date" style="color:${primaryColor};">${escapeHtml(post.date)}</p>
    <p class="hp-post-excerpt">${escapeHtml(post.content)}</p>
  </div>
</article>`
}

export function generateHomepagePostsSectionHTML(options: {
  posts: PublicBlogPost[]
  theme: SiteChromeTheme
  primaryColor: string
  sectionTitle: string
  blogHref: string
  showAllLink: boolean
  language?: SiteLanguage
}): string {
  if (!options.posts.length) return ''

  const language = options.language ?? 'he'
  const chromeCopy = getSiteChromeCopy(language)

  const t = TOKENS[options.theme]
  const blogTokens = getBlogThemeTokens(options.theme)
  const cards = options.posts.map((p, i) => postCard(p, t, options.primaryColor, i)).join('\n')
  const templates = generateBlogPostDetailTemplates(options.posts, options.theme, options.primaryColor)
  const modalMarkup = generateBlogModalMarkup({
    surface: blogTokens.surface,
    text: blogTokens.text,
  })

  const moreLinkHtml = options.showAllLink
    ? generateHomepageMoreLinkHTML({
        href: options.blogHref,
        label: chromeCopy.viewAllPosts,
        primaryColor: options.primaryColor,
        includeStyles: false,
        language,
      })
    : ''

  const isClassic = options.theme === 'classic'
  const isElegant = options.theme === 'elegant'

  const sectionCss = isClassic
    ? `${HOMEPAGE_POSTS_CSS}${CLASSIC_HOMEPAGE_POSTS_CSS}${BLOG_MODAL_CSS}`
    : isElegant
      ? `${HOMEPAGE_POSTS_CSS}${ELEGANT_HOMEPAGE_POSTS_CSS(options.primaryColor)}${BLOG_MODAL_CSS}`
      : `${HOMEPAGE_POSTS_CSS}${BLOG_MODAL_CSS}`

  const headerHtml = isElegant
    ? `<div class="hp-posts-header hp-posts-header--with-more hp-posts-header--elegant stagger-reveal" data-reveal-delay="0">
<div class="hp-posts-header__titles">
<div class="elegant-section-heading">
<span class="elegant-section-heading__watermark" aria-hidden="true">BLOG</span>
<h2 class="elegant-section-heading__title text-3xl md:text-4xl">${escapeHtml(options.sectionTitle)}</h2>
</div>
</div>
${options.showAllLink ? `<div class="hp-posts-header__more">${moreLinkHtml}</div>` : ''}
</div>`
    : `<div class="hp-posts-header hp-posts-header--with-more${isClassic ? ' hp-posts-header--classic' : ''} stagger-reveal" data-reveal-delay="0">
<div class="hp-posts-header__titles">
<span class="hp-posts-eyebrow" style="color:${options.primaryColor};">${escapeHtml(t.eyebrow)}</span>
<h2 class="hp-posts-title" style="font-family:${t.titleFont};color:${t.text};">${escapeHtml(options.sectionTitle)}</h2>
<div class="hp-posts-divider" style="background:${options.primaryColor};"></div>
</div>
${options.showAllLink ? `<div class="hp-posts-header__more">${moreLinkHtml}</div>` : ''}
</div>`

  return `
<section class="hp-posts-section" id="posts">
<style>${sectionCss}</style>
${headerHtml}
<div class="hp-posts-grid">
${cards}
</div>
${templates}
${modalMarkup}
</section>
<script>${BLOG_MODAL_INIT_SCRIPT}</script>`
}
