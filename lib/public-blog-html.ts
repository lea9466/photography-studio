import {
  buildPublicSiteChrome,
  generateSiteFooter,
  generateSiteNav,
  generateSiteNavScrollScript,
  generateSiteNavStyles,
  publicSiteLtrCss,
  publicSitePageHtmlAttrs,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'
import type { PhotographerSiteTheme } from '@/lib/photographer-site-paths'
import { buildCanonicalUrl } from '@/lib/seo/public-metadata'
import { buildPostCanonicalPath } from '@/lib/seo/photographer-discovery'
import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

export type PublicBlogPost = {
  id: string
  title: string
  subtitle: string | null
  content: string
  date: string
  coverUrl: string | null
  images: string[]
}

export type PublicBlogPostNavItem = {
  id: string
  title: string
  coverUrl: string | null
  postPath: string
}

export type PublicBlogPageData = {
  pageTitle: string
  posts: PublicBlogPost[]
  accentColor: string
}

function toChromeTheme(theme: PhotographerSiteTheme): SiteChromeTheme {
  return theme === 'bold' ? 'dark' : theme
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

type ThemeTokens = {
  bg: string
  surface: string
  text: string
  variant: string
  outline: string
  cardBg: string
  cardRadius: string
  cardBorder: string
  imageRadius: string
}

const TOKENS: Record<SiteChromeTheme, ThemeTokens> = {
  elegant: {
    bg: '#FAFAF8',
    surface: '#fdf8f7',
    text: '#1c1b1b',
    variant: '#464742',
    outline: '#c7c7c0',
    cardBg: '#fdf8f7',
    cardRadius: '0px',
    cardBorder: '1px solid rgba(0,0,0,0.06)',
    imageRadius: '0px',
  },
  classic: {
    bg: '#FAFAF8',
    surface: '#ffffff',
    text: '#1c1917',
    variant: '#57534e',
    outline: '#d6d3d1',
    cardBg: '#ffffff',
    cardRadius: '4px',
    cardBorder: '1px solid rgba(0,0,0,0.06)',
    imageRadius: '4px',
  },
  modern: {
    bg: '#F8FAFC',
    surface: '#ffffff',
    text: '#0F172A',
    variant: '#475569',
    outline: '#cbd5e1',
    cardBg: '#ffffff',
    cardRadius: '12px',
    cardBorder: '1px solid #e2e8f0',
    imageRadius: '12px',
  },
  dark: {
    bg: '#121217',
    surface: '#1A1A22',
    text: '#F5F5F0',
    variant: '#B8B8C0',
    outline: 'rgba(255,255,255,0.12)',
    cardBg: '#1A1A22',
    cardRadius: '2px',
    cardBorder: '1px solid rgba(255,255,255,0.06)',
    imageRadius: '2px',
  },
}

function titleFontClass(theme: SiteChromeTheme) {
  if (theme === 'elegant' || theme === 'classic') return 'font-serif-hebrew'
  return 'font-headline font-bold'
}

function eyebrowLabel(theme: SiteChromeTheme) {
  if (theme === 'modern') return 'BLOG'
  if (theme === 'dark') return 'JOURNAL'
  if (theme === 'classic') return 'Stories'
  return 'Journal'
}

const BLOG_MODAL_CSS = `
.blog-modal {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: none;
  background: rgba(0, 0, 0, 0.62);
  overflow-y: auto;
  padding: 24px 12px 64px;
  -webkit-overflow-scrolling: touch;
}
.blog-modal.is-open { display: block; }
.blog-modal__dialog {
  position: relative;
  width: min(940px, 96vw);
  margin: 24px auto;
  padding: 40px 28px 56px;
  border-radius: 6px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
}
@media (min-width: 768px) { .blog-modal__dialog { padding: 56px 56px 72px; } }
.blog-modal__close {
  position: absolute;
  top: 14px;
  inset-inline-end: 14px;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(127,127,127,0.3);
  background: rgba(127,127,127,0.12);
  color: inherit;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  transition: background 0.2s ease;
}
.blog-modal__close:hover { background: rgba(127,127,127,0.25); }
.blog-detail__title { font-size: 30px; line-height: 1.2; text-align: center; font-weight: 600; }
@media (min-width: 768px) { .blog-detail__title { font-size: 42px; } }
.blog-detail__subtitle { text-align: center; margin-top: 14px; font-size: 18px; opacity: 0.8; }
.blog-detail__date { text-align: center; margin-top: 16px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
.blog-detail__divider { width: 56px; height: 1px; margin: 28px auto 0; opacity: 0.5; }
.blog-detail__content {
  margin: 36px auto 0;
  max-width: 620px;
  font-size: 17px;
  line-height: 1.9;
  white-space: pre-line;
  text-align: center;
}
.blog-detail__images {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  margin-top: 48px;
}
.blog-detail__image {
  width: 62%;
  max-width: 100%;
  height: auto;
  display: block;
}
@media (max-width: 768px) { .blog-detail__image { width: 100%; } }
.blog-detail__share {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
}
.blog-detail__share-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 18px;
}
.blog-detail__share-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.blog-detail__share-icon:hover {
  transform: scale(1.08);
  opacity: 0.78;
}
.blog-detail__share-icon svg {
  display: block;
  width: 22px;
  height: 22px;
}
.blog-detail__share-icon.is-copied {
  transform: scale(1);
  opacity: 1;
}
.blog-detail--page .blog-detail__title {
  text-align: center;
  font-weight: 700;
  font-size: 34px;
  line-height: 1.2;
  margin: 0;
}
@media (min-width: 768px) {
  .blog-detail--page .blog-detail__title { font-size: 50px; }
}
.blog-detail--page .blog-detail__subtitle {
  text-align: center;
  margin-top: 16px;
  font-size: 19px;
}
.blog-detail--page .blog-detail__date {
  text-align: center;
  margin-top: 0;
  font-size: 13px;
}
.blog-detail--page .blog-detail__share {
  justify-content: center;
  margin-top: 30px;
}
.blog-detail--page .blog-detail__divider {
  margin: 36px auto 0;
}
.blog-detail--page .blog-detail__content {
  text-align: center;
  margin: 44px auto 0;
  max-width: none;
  width: 100%;
  font-size: 18px;
  line-height: 1.85;
}
.blog-detail--page .blog-detail__images {
  align-items: center;
  margin-top: 52px;
  gap: 32px;
}
.blog-detail--page .blog-detail__image {
  width: 100%;
  max-width: 100%;
  height: auto;
}
.blog-card__peek,
.hp-post-card__peek {
  position: absolute;
  z-index: 2;
  top: 12px;
  inset-inline-end: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 9999px;
  background: rgba(0,0,0,0.62);
  color: #fff;
  font-size: 12px;
  letter-spacing: 0.04em;
  cursor: pointer;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s ease;
  pointer-events: none;
}
.blog-card:hover .blog-card__peek,
.blog-card:focus-within .blog-card__peek,
.hp-post-card:hover .hp-post-card__peek,
.hp-post-card:focus-within .hp-post-card__peek {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
@media (max-width: 768px) {
  .blog-card__peek,
  .hp-post-card__peek {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
    background: rgba(0,0,0,0.72);
  }
}
.blog-card,
.hp-post-card {
  text-decoration: none;
  color: inherit;
}
.blog-post-hero {
  position: relative;
  width: 100%;
  height: clamp(360px, 58vh, 640px);
  overflow: hidden;
  background: rgba(0,0,0,0.06);
}
.blog-post-hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.blog-post-hero__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.52);
  pointer-events: none;
}
.blog-post-hero__fade {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 48%;
  z-index: 2;
  pointer-events: none;
}
.blog-post-hero__caption {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 48px 24px 36px;
  text-align: center;
  pointer-events: none;
}
.blog-post-hero__title {
  margin: 0;
  font-weight: 700;
  font-size: 32px;
  line-height: 1.2;
  max-width: min(65%, 760px);
  color: inherit;
  text-shadow: none;
}
.blog-post-page--dark .blog-post-hero__title {
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.18);
}
@media (min-width: 768px) {
  .blog-post-hero__title { font-size: 48px; }
}
.blog-post-hero__subtitle {
  margin: 12px 0 0;
  font-size: 18px;
  opacity: 0.82;
  max-width: min(65%, 680px);
  color: inherit;
}
.blog-post-page__content {
  width: 65%;
  margin-inline: auto;
  padding: 40px 32px 96px;
  box-sizing: border-box;
  text-align: center;
}
.blog-post-page__content[dir="rtl"] {
  direction: rtl;
}
.blog-post-page__content[dir="ltr"] {
  direction: ltr;
}
@media (max-width: 1024px) {
  .blog-post-page__content { width: 78%; }
}
@media (max-width: 768px) {
  .blog-post-page__content {
    width: 100%;
    padding-inline: 20px;
    padding-top: 40px;
    padding-bottom: 72px;
  }
}
.blog-post-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 64px;
  padding-top: 40px;
  border-top: 1px solid rgba(127,127,127,0.2);
}
@media (max-width: 640px) {
  .blog-post-nav { grid-template-columns: 1fr; }
}
.blog-post-nav__item {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid rgba(127,127,127,0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.blog-post-nav__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0,0,0,0.08);
}
.blog-post-nav__item--next {
  flex-direction: row-reverse;
  text-align: end;
}
.blog-post-nav__thumb {
  width: 72px;
  height: 54px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(0,0,0,0.06);
}
.blog-post-nav__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.blog-post-nav__label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.65;
  margin-bottom: 4px;
}
.blog-post-nav__title {
  font-size: 15px;
  line-height: 1.35;
}
.blog-post-main--with-hero {
  padding-top: 0;
}
.blog-post-main--with-hero .blog-post-page__content {
  margin-top: -32px;
  position: relative;
  z-index: 4;
}
`

function blogPostHeroThemeCss(theme: SiteChromeTheme, pageBg: string): string {
  if (theme === 'dark') {
    return `
.blog-post-page--dark .blog-post-hero__img {
  filter: saturate(0.9) brightness(0.94) contrast(0.98);
}
.blog-post-page--dark .blog-post-hero__overlay {
  background-color: rgba(255, 255, 255, 0.24);
}
.blog-post-page--dark .blog-post-hero__fade {
  height: 58%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(18, 18, 23, 0.08) 24%,
    rgba(18, 18, 23, 0.28) 42%,
    rgba(18, 18, 23, 0.52) 58%,
    rgba(18, 18, 23, 0.76) 74%,
    rgba(18, 18, 23, 0.92) 88%,
    ${pageBg} 100%
  );
}
.blog-post-page--dark .blog-post-main--with-hero .blog-post-page__content {
  margin-top: -40px;
}`
  }

  return `
.blog-post-hero__fade {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 30%,
    ${pageBg}cc 72%,
    ${pageBg} 100%
  );
}`
}

const BLOG_POST_PAGE_NAV_CSS = `
nav#main-nav:not(.nav-scrolled),
.elegant-nav:not(.nav-scrolled),
.modern-nav:not(.nav-scrolled),
.classic-nav:not(.nav-scrolled),
.bold-nav:not(.nav-scrolled) {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  box-shadow: none !important;
  border-bottom: none !important;
}
.blog-post-page .classic-nav:not(.nav-scrolled) .classic-nav-brand,
.blog-post-page .classic-nav:not(.nav-scrolled) .classic-nav-link,
.blog-post-page .classic-nav:not(.nav-scrolled) .classic-nav-menu-btn {
  color: #ffffff;
}
.blog-post-page .classic-nav:not(.nav-scrolled) .classic-nav-link:hover,
.blog-post-page .classic-nav:not(.nav-scrolled) .classic-nav-menu-btn:hover {
  color: rgba(255, 255, 255, 0.75);
}
.blog-post-page .classic-nav:not(.nav-scrolled) .classic-nav-logo {
  filter: brightness(0) invert(1);
}
`

const BLOG_CSS = `
.blog-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}
@media (min-width: 640px) { .blog-grid { grid-template-columns: repeat(2, 1fr); gap: 32px; } }
@media (min-width: 1024px) { .blog-grid { grid-template-columns: repeat(3, 1fr); gap: 36px; } }
.blog-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  text-align: right;
  text-decoration: none;
  color: inherit;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  opacity: 0;
  transform: translateY(18px);
}
.blog-card.is-visible { opacity: 1; transform: translateY(0); }
.blog-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(0,0,0,0.12); }
.blog-card:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.blog-card__media {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: rgba(0,0,0,0.06);
}
.blog-card__media--empty {
  aspect-ratio: 4 / 3;
}
.blog-card__media img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  transition: transform 0.7s ease;
}
.blog-card:hover .blog-card__media img { transform: scale(1.05); }
.blog-card__media--empty::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.12));
}
.blog-card__body { padding: 20px 18px 24px; text-align: center; display: flex; flex-direction: column; gap: 8px; }
.blog-card__title { font-size: 22px; line-height: 1.25; }
.blog-card__date { font-size: 13px; letter-spacing: 0.02em; }
.blog-card__excerpt {
  font-size: 15px;
  line-height: 1.7;
  opacity: 0.85;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-line;
}
.blog-empty { text-align: center; padding: 80px 0; opacity: 0.7; font-size: 18px; }
${BLOG_MODAL_CSS}
`

function blogHead(
  theme: SiteChromeTheme,
  studioName: string,
  primaryColor: string,
  pageTitle: string,
  shouldColorLogo: boolean,
  siteLanguage?: string | null,
  options?: { isPostPage?: boolean }
) {
  const t = TOKENS[theme]
  const title = escapeHtml(`${pageTitle} | ${studioName}`)
  const ltrCss = publicSiteLtrCss(siteLanguage)
  return `
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${title}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "${primaryColor}",
        accent: "${primaryColor}",
        background: "${t.bg}",
        surface: "${t.surface}",
        "on-surface": "${t.text}",
        "on-surface-variant": "${t.variant}",
        "outline-variant": "${t.outline}",
      },
      spacing: { xs: "8px", sm: "12px", md: "16px", lg: "24px", xl: "32px", xxl: "80px", "margin-mobile": "16px", "margin-desktop": "64px" },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Heebo", "sans-serif"],
        "serif-hebrew": ["Frank Ruhl Libre", "serif"],
        headline: ["Space Grotesk", "Heebo", "sans-serif"],
        "headline-sm": ["Frank Ruhl Libre", "serif"],
      },
      fontSize: {
        "headline-md": ["36px", { lineHeight: "1.2", fontWeight: "600" }],
        "headline-sm": ["24px", { lineHeight: "1.2", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6" }],
        "label-sm": ["13px", { lineHeight: "1" }],
      },
    },
  },
};
</script>
<style>
body { font-family: 'Heebo', sans-serif; background: ${t.bg}; color: ${t.text}; }
.font-serif-hebrew { font-family: 'Frank Ruhl Libre', serif; }
.font-display { font-family: 'Playfair Display', serif; }
.font-body { font-family: 'Heebo', sans-serif; }
.font-headline { font-family: 'Space Grotesk', 'Heebo', sans-serif; }
.elegant-accent { color: ${primaryColor}; }
.elegant-bg-accent { background-color: ${primaryColor}; }
${BLOG_CSS}
${options?.isPostPage ? BLOG_POST_PAGE_NAV_CSS : ''}
${options?.isPostPage ? `
.blog-post-page--dark .bold-nav .bold-nav-logo:not(.brand-logo-colorable) {
  filter: brightness(0) invert(1) !important;
}` : ''}
${options?.isPostPage ? blogPostHeroThemeCss(theme, t.bg) : ''}
${generateSiteNavStyles(theme, primaryColor, shouldColorLogo)}
${ltrCss}
</style>
</head>
<body class="bg-background text-on-surface overflow-x-hidden${options?.isPostPage ? ' blog-post-page' : ''}${options?.isPostPage && theme === 'dark' ? ' blog-post-page--dark' : ''}">`
}

function blogCopy(language: SiteLanguage) {
  return {
    quickPreview: language === 'en' ? 'Quick Preview' : 'תצוגה מקדימה',
    share: language === 'en' ? 'Share' : 'שתף',
    copyLink: language === 'en' ? 'Copy link' : 'העתק קישור',
    copied: language === 'en' ? 'Copied!' : 'הועתק!',
    previousPost: language === 'en' ? 'Previous post' : 'הפוסט הקודם',
    nextPost: language === 'en' ? 'Next post' : 'הפוסט הבא',
  }
}

function blogShareIcon(type: 'link' | 'whatsapp' | 'email', color: string): string {
  const stroke = escapeHtml(color)
  if (type === 'link') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
  }
  if (type === 'whatsapp') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`
}

function generateBlogShareLinks(
  shareUrl: string,
  postTitle: string,
  primaryColor: string,
  language: SiteLanguage
): string {
  const copy = blogCopy(language)
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(postTitle)
  const whatsappText = encodeURIComponent(`${postTitle} ${shareUrl}`)
  const emailSubject = encodeURIComponent(postTitle)
  const emailBody = encodeURIComponent(`${postTitle}\n\n${shareUrl}`)

  return `
<div class="blog-detail__share">
  <div class="blog-detail__share-links">
    <button type="button" class="blog-detail__share-icon blog-detail__share-copy" data-share-url="${escapeHtml(shareUrl)}" data-copied-label="${escapeHtml(copy.copied)}" aria-label="${escapeHtml(copy.copyLink)}">${blogShareIcon('link', primaryColor)}</button>
    <a class="blog-detail__share-icon" href="https://wa.me/?text=${whatsappText}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">${blogShareIcon('whatsapp', primaryColor)}</a>
    <a class="blog-detail__share-icon" href="mailto:?subject=${emailSubject}&body=${emailBody}" aria-label="${language === 'en' ? 'Email' : 'אימייל'}">${blogShareIcon('email', primaryColor)}</a>
  </div>
</div>`
}

export function generateBlogPostContent(
  post: PublicBlogPost,
  theme: SiteChromeTheme,
  primaryColor: string,
  options: {
    shareUrl: string
    siteLanguage?: string | null
    headingTag?: 'h1' | 'h2'
    includeSubtitle?: boolean
    excludeTitle?: boolean
  }
): string {
  const t = TOKENS[theme]
  const titleFont = titleFontClass(theme)
  const language = resolveSiteLanguage(options.siteLanguage)
  const headingTag = options.headingTag ?? 'h2'
  const images = post.images
    .map(
      (url) =>
        `<img class="blog-detail__image" src="${escapeHtml(url)}" alt="${escapeHtml(post.title)}" loading="lazy" style="border-radius:${t.imageRadius};" />`
    )
    .join('\n')

  const subtitle =
    options.includeSubtitle !== false && post.subtitle
      ? `<p class="blog-detail__subtitle">${escapeHtml(post.subtitle)}</p>`
      : ''

  const shareLinks = generateBlogShareLinks(options.shareUrl, post.title, primaryColor, language)
  const titleBlock = options.excludeTitle
    ? ''
    : `<${headingTag} class="blog-detail__title ${titleFont}">${escapeHtml(post.title)}</${headingTag}>
    ${subtitle}`

  return `
  <header>
    ${titleBlock}
    <p class="blog-detail__date" style="color:${primaryColor};">${escapeHtml(post.date)}</p>
    ${shareLinks}
    <div class="blog-detail__divider elegant-bg-accent"></div>
  </header>
  <div class="blog-detail__content">${escapeHtml(post.content)}</div>
  ${images ? `<div class="blog-detail__images">${images}</div>` : ''}`
}

function blogCard(
  post: PublicBlogPost,
  theme: SiteChromeTheme,
  primaryColor: string,
  postPath: string,
  siteLanguage?: string | null
) {
  const t = TOKENS[theme]
  const cover = post.coverUrl || post.images[0] || null
  const titleFont = titleFontClass(theme)
  const language = resolveSiteLanguage(siteLanguage)
  const copy = blogCopy(language)
  const peekButton = `<button type="button" class="blog-card__peek" data-post-id="${escapeHtml(post.id)}" aria-label="${escapeHtml(copy.quickPreview)}">${escapeHtml(copy.quickPreview)}</button>`
  const media = cover
    ? `<div class="blog-card__media">${peekButton}<img src="${escapeHtml(cover)}" alt="${escapeHtml(post.title)}" loading="lazy" /></div>`
    : `<div class="blog-card__media blog-card__media--empty">${peekButton}</div>`

  return `
<a class="blog-card" href="${escapeHtml(postPath)}" target="_parent" data-post-id="${escapeHtml(post.id)}" style="background:${t.cardBg};border-radius:${t.cardRadius};border:${t.cardBorder};">
  ${media}
  <div class="blog-card__body">
    <h2 class="blog-card__title ${titleFont}">${escapeHtml(post.title)}</h2>
    <p class="blog-card__date" style="color:${primaryColor};">${escapeHtml(post.date)}</p>
    <p class="blog-card__excerpt">${escapeHtml(post.content)}</p>
  </div>
</a>`
}

function blogDetailTemplate(
  post: PublicBlogPost,
  theme: SiteChromeTheme,
  primaryColor: string,
  shareUrl: string,
  siteLanguage?: string | null
) {
  const content = generateBlogPostContent(post, theme, primaryColor, {
    shareUrl,
    siteLanguage,
    headingTag: 'h2',
  })

  return `
<template id="blog-post-tpl-${escapeHtml(post.id)}">
<article class="blog-detail">
${content}
</article>
</template>`
}

function blogBody(
  data: PublicBlogPageData,
  theme: SiteChromeTheme,
  studioPath: string,
  siteLanguage?: string | null
) {
  const titleFont = titleFontClass(theme)
  const eyebrow = eyebrowLabel(theme)
  const primaryColor = data.accentColor

  const content = data.posts.length
    ? `<div class="blog-grid">
${data.posts
  .map((post) =>
    blogCard(
      post,
      theme,
      primaryColor,
      buildPostCanonicalPath(studioPath, post.id),
      siteLanguage
    )
  )
  .join('\n')}
</div>`
    : `<p class="blog-empty">עדיין אין פוסטים.</p>`

  return `
<main class="pt-24">
<section class="max-w-[1280px] mx-auto px-[24px] pt-10 pb-24">
<header class="text-center mb-[56px]">
<span class="text-[13px] uppercase tracking-[0.2em] mb-[16px] block elegant-accent">${eyebrow}</span>
<h1 class="${titleFont} text-[40px] md:text-[60px] mb-[16px] font-medium">${escapeHtml(data.pageTitle)}</h1>
<div class="w-16 h-px mx-auto elegant-bg-accent"></div>
</header>
${content}
</section>
</main>`
}

const revealScript = `
(function initBlogReveal() {
  function boot() {
    var cards = [].slice.call(document.querySelectorAll('.blog-card'));
    if (!cards.length) return;
    if (!('IntersectionObserver' in window)) {
      cards.forEach(function(c) { c.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    cards.forEach(function(c) { observer.observe(c); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`

export { BLOG_MODAL_CSS }

/** Typography and accent utilities used inside blog modal templates on the homepage iframe. */
export function buildBlogModalSupportCss(primaryColor: string): string {
  return `
.font-serif-hebrew { font-family: 'Frank Ruhl Libre', serif; }
.font-display { font-family: 'Playfair Display', serif; }
.font-body { font-family: 'Heebo', sans-serif; }
.font-headline { font-family: 'Space Grotesk', 'Heebo', sans-serif; font-weight: 700; }
.font-bold { font-weight: 700; }
.elegant-accent { color: ${primaryColor}; }
.elegant-bg-accent { background-color: ${primaryColor}; }
`
}

/** Inject into the homepage iframe <head> so modal styles apply globally. */
export function buildHomepageBlogModalHeadBlock(primaryColor: string): string {
  return `<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;500;700;900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet"/>
<style id="homepage-blog-modal-styles">${buildBlogModalSupportCss(primaryColor)}${BLOG_MODAL_CSS}</style>`
}

export function getBlogThemeTokens(theme: SiteChromeTheme) {
  return TOKENS[theme]
}

export function generateBlogPostDetailTemplates(
  posts: PublicBlogPost[],
  theme: SiteChromeTheme,
  primaryColor: string,
  studioPath: string,
  siteLanguage?: string | null
): string {
  return posts
    .map((post) => {
      const shareUrl = buildCanonicalUrl(buildPostCanonicalPath(studioPath, post.id))
      return blogDetailTemplate(post, theme, primaryColor, shareUrl, siteLanguage)
    })
    .join('\n')
}

export function generateBlogModalMarkup(options: { surface: string; text: string }): string {
  return `
<div id="blog-modal" class="blog-modal" aria-hidden="true">
  <div class="blog-modal__dialog" style="background:${options.surface};color:${options.text};">
    <button type="button" class="blog-modal__close" aria-label="סגור">&times;</button>
    <div id="blog-modal-body"></div>
  </div>
</div>`
}

export const BLOG_SHARE_COPY_SCRIPT = `
(function initBlogShareCopy() {
  function boot() {
    document.addEventListener('click', function(event) {
      var button = event.target && event.target.closest
        ? event.target.closest('.blog-detail__share-copy')
        : null;
      if (!button) return;
      var url = button.getAttribute('data-share-url');
      if (!url) return;
      var copiedLabel = button.getAttribute('data-copied-label') || 'Copied!';
      var originalLabel = button.getAttribute('aria-label') || '';
      function markCopied() {
        button.classList.add('is-copied');
        button.setAttribute('aria-label', copiedLabel);
        setTimeout(function() {
          button.classList.remove('is-copied');
          button.setAttribute('aria-label', originalLabel);
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(markCopied).catch(function() {});
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`

export const BLOG_MODAL_INIT_SCRIPT = `
(function initBlogModal() {
  function boot() {
    var modal = document.getElementById('blog-modal');
    var body = document.getElementById('blog-modal-body');
    var closeBtn = modal && modal.querySelector('.blog-modal__close');
    if (!modal || !body || !closeBtn) return;

    function open(id) {
      var tpl = document.getElementById('blog-post-tpl-' + id);
      if (!tpl) return;
      body.innerHTML = tpl.innerHTML;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      modal.scrollTop = 0;
    }
    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      body.innerHTML = '';
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.blog-card__peek, .hp-post-card__peek').forEach(function(button) {
      button.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        open(button.getAttribute('data-post-id'));
      });
    });

    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function(event) {
      if (event.target === modal) close();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`

export function generatePublicBlogPageHTML(options: {
  theme: PhotographerSiteTheme
  studioName: string
  logoUrl: string | null
  homepagePath: string
  blogPath: string
  studioPath: string
  blog: PublicBlogPageData
  hasFaq?: boolean
  hasPackages?: boolean
  hasPhotoEditComparisons?: boolean
  beforeAfterPath?: string
  shouldColorLogo?: boolean
  siteLanguage?: string | null
}) {
  const chromeTheme = toChromeTheme(options.theme)
  const primaryColor = options.blog.accentColor
  const t = TOKENS[chromeTheme]

  const chrome = buildPublicSiteChrome({
    theme: chromeTheme,
    studioName: options.studioName,
    logoUrl: options.logoUrl,
    primaryColor,
    homepagePath: options.homepagePath,
    linkMode: 'href',
    hasFaq: options.hasFaq ?? false,
    hasPackages: options.hasPackages ?? false,
    hasBlog: true,
    blogPath: options.blogPath,
    hasPhotoEditComparisons: options.hasPhotoEditComparisons ?? false,
    beforeAfterPath: options.beforeAfterPath,
    shouldColorLogo: options.shouldColorLogo ?? false,
    siteLanguage: options.siteLanguage,
  })

  const templates = generateBlogPostDetailTemplates(
    options.blog.posts,
    chromeTheme,
    primaryColor,
    options.studioPath,
    options.siteLanguage
  )

  const modalMarkup = generateBlogModalMarkup({
    surface: t.surface,
    text: t.text,
  })

  return `<!DOCTYPE html>
<html ${publicSitePageHtmlAttrs(options.siteLanguage)} style="scroll-behavior: smooth;">
${blogHead(chromeTheme, options.studioName, primaryColor, options.blog.pageTitle, options.shouldColorLogo ?? false, options.siteLanguage)}
${generateSiteNav(chrome)}
${blogBody(options.blog, chromeTheme, options.studioPath, options.siteLanguage)}
${templates}
${modalMarkup}
${generateSiteFooter(chrome)}
<script>${revealScript}</script>
<script>${BLOG_MODAL_INIT_SCRIPT}</script>
<script>${BLOG_SHARE_COPY_SCRIPT}</script>
</body>
</html>`
}

function blogPostNavItem(
  item: PublicBlogPostNavItem,
  direction: 'prev' | 'next',
  primaryColor: string,
  language: SiteLanguage
): string {
  const copy = blogCopy(language)
  const label = direction === 'prev' ? copy.previousPost : copy.nextPost
  const thumb = item.coverUrl
    ? `<div class="blog-post-nav__thumb"><img src="${escapeHtml(item.coverUrl)}" alt="" loading="lazy" /></div>`
    : `<div class="blog-post-nav__thumb"></div>`

  return `
<a class="blog-post-nav__item blog-post-nav__item--${direction}" href="${escapeHtml(item.postPath)}" target="_parent">
  ${thumb}
  <div>
    <div class="blog-post-nav__label" style="color:${primaryColor};">${label}</div>
    <div class="blog-post-nav__title">${escapeHtml(item.title)}</div>
  </div>
</a>`
}

function blogPostPageBody(
  post: PublicBlogPost,
  theme: SiteChromeTheme,
  primaryColor: string,
  shareUrl: string,
  prevPost: PublicBlogPostNavItem | null,
  nextPost: PublicBlogPostNavItem | null,
  siteLanguage?: string | null
) {
  const language = resolveSiteLanguage(siteLanguage)
  const contentDir = language === 'en' ? 'ltr' : 'rtl'
  const titleFont = titleFontClass(theme)
  const cover = post.coverUrl || post.images[0] || null
  const heroSubtitle = post.subtitle
    ? `<p class="blog-post-hero__subtitle">${escapeHtml(post.subtitle)}</p>`
    : ''

  const hero = cover
    ? `<div class="blog-post-hero">
  <img class="blog-post-hero__img" src="${escapeHtml(cover)}" alt="${escapeHtml(post.title)}" />
  <div class="blog-post-hero__overlay" aria-hidden="true"></div>
  <div class="blog-post-hero__fade" aria-hidden="true"></div>
  <div class="blog-post-hero__caption">
    <h1 class="blog-post-hero__title ${titleFont}">${escapeHtml(post.title)}</h1>
    ${heroSubtitle}
  </div>
</div>`
    : ''

  const content = generateBlogPostContent(post, theme, primaryColor, {
    shareUrl,
    siteLanguage,
    headingTag: 'h1',
    excludeTitle: Boolean(cover),
    includeSubtitle: !cover,
  })

  const navItems = [
    prevPost ? blogPostNavItem(prevPost, 'prev', primaryColor, language) : '<div></div>',
    nextPost ? blogPostNavItem(nextPost, 'next', primaryColor, language) : '<div></div>',
  ].join('\n')

  const nav =
    prevPost || nextPost
      ? `<nav class="blog-post-nav" aria-label="${language === 'en' ? 'Post navigation' : 'ניווט בין פוסטים'}">${navItems}</nav>`
      : ''

  return `
<main class="${cover ? 'blog-post-main--with-hero' : 'pt-24'}">
${hero}
<section class="blog-post-page__content" dir="${contentDir}">
<article class="blog-detail blog-detail--page">
${content}
</article>
${nav}
</section>
</main>`
}

export function generatePublicBlogPostPageHTML(options: {
  theme: PhotographerSiteTheme
  studioName: string
  logoUrl: string | null
  homepagePath: string
  blogPath: string
  postPath: string
  post: PublicBlogPost
  prevPost: PublicBlogPostNavItem | null
  nextPost: PublicBlogPostNavItem | null
  accentColor: string
  hasFaq?: boolean
  hasPackages?: boolean
  hasBlog?: boolean
  hasPhotoEditComparisons?: boolean
  beforeAfterPath?: string
  shouldColorLogo?: boolean
  siteLanguage?: string | null
}) {
  const chromeTheme = toChromeTheme(options.theme)
  const primaryColor = options.accentColor
  const shareUrl = buildCanonicalUrl(options.postPath)

  const chrome = buildPublicSiteChrome({
    theme: chromeTheme,
    studioName: options.studioName,
    logoUrl: options.logoUrl,
    primaryColor,
    homepagePath: options.homepagePath,
    linkMode: 'href',
    hasFaq: options.hasFaq ?? false,
    hasPackages: options.hasPackages ?? false,
    hasBlog: options.hasBlog ?? true,
    blogPath: options.blogPath,
    hasPhotoEditComparisons: options.hasPhotoEditComparisons ?? false,
    beforeAfterPath: options.beforeAfterPath,
    shouldColorLogo: options.shouldColorLogo ?? false,
    siteLanguage: options.siteLanguage,
    transparentNav: true,
  })

  return `<!DOCTYPE html>
<html ${publicSitePageHtmlAttrs(options.siteLanguage)} style="scroll-behavior: smooth;">
${blogHead(chromeTheme, options.studioName, primaryColor, options.post.title, options.shouldColorLogo ?? false, options.siteLanguage, { isPostPage: true })}
${generateSiteNav(chrome)}
${blogPostPageBody(
  options.post,
  chromeTheme,
  primaryColor,
  shareUrl,
  options.prevPost,
  options.nextPost,
  options.siteLanguage
)}
${generateSiteFooter(chrome)}
<script>${generateSiteNavScrollScript(chromeTheme, 'scroll')}</script>
<script>${BLOG_SHARE_COPY_SCRIPT}</script>
</body>
</html>`
}
