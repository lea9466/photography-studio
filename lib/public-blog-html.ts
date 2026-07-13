import {
  buildPublicSiteChrome,
  generateSiteFooter,
  generateSiteNav,
  generateSiteNavStyles,
  publicSiteLtrCss,
  publicSitePageHtmlAttrs,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'
import type { PhotographerSiteTheme } from '@/lib/photographer-site-paths'

export type PublicBlogPost = {
  id: string
  title: string
  subtitle: string | null
  content: string
  date: string
  coverUrl: string | null
  images: string[]
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
.blog-detail__title { font-size: 30px; line-height: 1.2; text-align: center; }
@media (min-width: 768px) { .blog-detail__title { font-size: 42px; } }
.blog-detail__subtitle { text-align: center; margin-top: 10px; font-size: 18px; opacity: 0.8; }
.blog-detail__date { text-align: center; margin-top: 12px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
.blog-detail__divider { width: 56px; height: 1px; margin: 24px auto 0; opacity: 0.5; }
.blog-detail__content {
  margin: 32px auto 0;
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
  gap: 24px;
  margin-top: 44px;
}
.blog-detail__image {
  width: 62%;
  max-width: 100%;
  height: auto;
  display: block;
}
@media (max-width: 768px) { .blog-detail__image { width: 100%; } }
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
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: rgba(0,0,0,0.06);
}
.blog-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  siteLanguage?: string | null
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
${generateSiteNavStyles(theme, primaryColor, shouldColorLogo)}
${ltrCss}
</style>
</head>
<body class="bg-background text-on-surface overflow-x-hidden">`
}

function blogCard(post: PublicBlogPost, theme: SiteChromeTheme, primaryColor: string) {
  const t = TOKENS[theme]
  const cover = post.coverUrl || post.images[0] || null
  const titleFont = titleFontClass(theme)
  const media = cover
    ? `<div class="blog-card__media"><img src="${escapeHtml(cover)}" alt="${escapeHtml(post.title)}" loading="lazy" /></div>`
    : `<div class="blog-card__media blog-card__media--empty"></div>`

  return `
<article class="blog-card" data-post-id="${escapeHtml(post.id)}" role="button" tabindex="0" style="background:${t.cardBg};border-radius:${t.cardRadius};border:${t.cardBorder};">
  ${media}
  <div class="blog-card__body">
    <h2 class="blog-card__title ${titleFont}">${escapeHtml(post.title)}</h2>
    <p class="blog-card__date" style="color:${primaryColor};">${escapeHtml(post.date)}</p>
    <p class="blog-card__excerpt">${escapeHtml(post.content)}</p>
  </div>
</article>`
}

function blogDetailTemplate(post: PublicBlogPost, theme: SiteChromeTheme, primaryColor: string) {
  const t = TOKENS[theme]
  const titleFont = titleFontClass(theme)
  const images = post.images
    .map(
      (url) =>
        `<img class="blog-detail__image" src="${escapeHtml(url)}" alt="${escapeHtml(post.title)}" loading="lazy" style="border-radius:${t.imageRadius};" />`
    )
    .join('\n')

  const subtitle = post.subtitle
    ? `<p class="blog-detail__subtitle">${escapeHtml(post.subtitle)}</p>`
    : ''

  return `
<template id="blog-post-tpl-${escapeHtml(post.id)}">
<article class="blog-detail">
  <header>
    <h2 class="blog-detail__title ${titleFont}">${escapeHtml(post.title)}</h2>
    ${subtitle}
    <p class="blog-detail__date" style="color:${primaryColor};">${escapeHtml(post.date)}</p>
    <div class="blog-detail__divider elegant-bg-accent"></div>
  </header>
  <div class="blog-detail__content">${escapeHtml(post.content)}</div>
  ${images ? `<div class="blog-detail__images">${images}</div>` : ''}
</article>
</template>`
}

function blogBody(data: PublicBlogPageData, theme: SiteChromeTheme) {
  const titleFont = titleFontClass(theme)
  const eyebrow = eyebrowLabel(theme)
  const primaryColor = data.accentColor

  const content = data.posts.length
    ? `<div class="blog-grid">
${data.posts.map((post) => blogCard(post, theme, primaryColor)).join('\n')}
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

export function getBlogThemeTokens(theme: SiteChromeTheme) {
  return TOKENS[theme]
}

export function generateBlogPostDetailTemplates(
  posts: PublicBlogPost[],
  theme: SiteChromeTheme,
  primaryColor: string
): string {
  return posts.map((post) => blogDetailTemplate(post, theme, primaryColor)).join('\n')
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

    document.querySelectorAll('.blog-card, .hp-post-card').forEach(function(card) {
      card.addEventListener('click', function() { open(card.getAttribute('data-post-id')); });
      card.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(card.getAttribute('data-post-id'));
        }
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
  blog: PublicBlogPageData
  hasFaq?: boolean
  hasPackages?: boolean
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
    shouldColorLogo: options.shouldColorLogo ?? false,
    siteLanguage: options.siteLanguage,
  })

  const templates = generateBlogPostDetailTemplates(options.blog.posts, chromeTheme, primaryColor)

  const modalMarkup = generateBlogModalMarkup({
    surface: t.surface,
    text: t.text,
  })

  return `<!DOCTYPE html>
<html ${publicSitePageHtmlAttrs(options.siteLanguage)} style="scroll-behavior: smooth;">
${blogHead(chromeTheme, options.studioName, primaryColor, options.blog.pageTitle, options.shouldColorLogo ?? false, options.siteLanguage)}
${generateSiteNav(chrome)}
${blogBody(options.blog, chromeTheme)}
${templates}
${modalMarkup}
${generateSiteFooter(chrome)}
<script>${revealScript}</script>
<script>${BLOG_MODAL_INIT_SCRIPT}</script>
</body>
</html>`
}
