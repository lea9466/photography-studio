import type { SiteChromeTheme } from '@/lib/photographer-site-chrome'
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

const HOMEPAGE_POSTS_CSS = `
.hp-posts-section {
  width: 100%;
  padding-top: calc(2.5rem + 20px);
  padding-bottom: 3rem;
  padding-inline: 1rem;
}
@media (min-width: 768px) {
  .hp-posts-section { padding-top: calc(3.5rem + 20px); padding-bottom: 4rem; padding-inline: 2rem; }
}
.hp-posts-inner { max-width: 1320px; margin-inline: auto; }
.hp-posts-header { text-align: center; margin-bottom: 40px; }
.hp-posts-eyebrow { display: block; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 14px; }
.hp-posts-title { font-size: 32px; line-height: 1.2; font-weight: 500; }
@media (min-width: 768px) { .hp-posts-title { font-size: 46px; } }
.hp-posts-divider { width: 56px; height: 1px; margin: 18px auto 0; }
.hp-posts-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 28px;
}
@media (min-width: 640px) { .hp-posts-grid { gap: 30px; } }
@media (min-width: 1024px) { .hp-posts-grid { gap: 33px; } }
.hp-post-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  width: 100%;
  max-width: 100%;
  margin-inline: 0;
  transition: transform 0.4s ease, box-shadow 0.4s ease, opacity 0.6s ease;
  opacity: 0;
  transform: translateY(18px);
}
.hp-post-card.is-visible { opacity: 1; transform: translateY(0); }
.hp-post-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(0,0,0,0.12); }
.hp-post-card:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
@media (min-width: 640px) {
  .hp-post-card {
    width: calc((100% - 30px) / 2);
    max-width: 530px;
    margin-inline: 0;
  }
}
@media (min-width: 1024px) {
  .hp-post-card {
    width: calc((100% - 66px) / 3);
    max-width: none;
    margin-inline: 0;
  }
}
.hp-post-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(0,0,0,0.06);
}
.hp-post-media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.7s ease; }
.hp-post-card:hover .hp-post-media img { transform: scale(1.05); }
.hp-post-media--empty::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.12));
}
.hp-post-body { padding: 18px 16px 22px; text-align: center; display: flex; flex-direction: column; gap: 8px; }
.hp-post-title { font-size: 21px; line-height: 1.25; }
.hp-post-date { font-size: 13px; letter-spacing: 0.02em; }
.hp-post-excerpt {
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.85;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-line;
}
.hp-posts-more { text-align: center; margin-top: 40px; }
.hp-posts-more a {
  display: inline-block;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 12px 30px;
  border: 1px solid currentColor;
  text-decoration: none;
  transition: opacity 0.2s ease, background 0.2s ease;
}
.hp-posts-more a:hover { opacity: 0.7; }
`

function postCard(post: PublicBlogPost, t: SectionTokens, primaryColor: string): string {
  const cover = post.coverUrl || post.images[0] || null
  const media = cover
    ? `<div class="hp-post-media"><img src="${escapeHtml(cover)}" alt="${escapeHtml(post.title)}" loading="lazy" /></div>`
    : `<div class="hp-post-media hp-post-media--empty"></div>`

  return `
<article class="hp-post-card" data-post-id="${escapeHtml(post.id)}" role="button" tabindex="0" style="background:${t.cardBg};color:${t.text};border-radius:${t.cardRadius};border:${t.cardBorder};">
  ${media}
  <div class="hp-post-body">
    <h3 class="hp-post-title" style="font-family:${t.titleFont};">${escapeHtml(post.title)}</h3>
    <p class="hp-post-date" style="color:${primaryColor};">${escapeHtml(post.date)}</p>
    <p class="hp-post-excerpt">${escapeHtml(post.content)}</p>
  </div>
</article>`
}

const REVEAL_SCRIPT = `
(function initHpPostsReveal() {
  function boot() {
    var cards = [].slice.call(document.querySelectorAll('.hp-post-card'));
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

export function generateHomepagePostsSectionHTML(options: {
  posts: PublicBlogPost[]
  theme: SiteChromeTheme
  primaryColor: string
  sectionTitle: string
  blogHref: string
  showAllLink: boolean
}): string {
  if (!options.posts.length) return ''

  const t = TOKENS[options.theme]
  const blogTokens = getBlogThemeTokens(options.theme)
  const cards = options.posts.map((p) => postCard(p, t, options.primaryColor)).join('\n')
  const templates = generateBlogPostDetailTemplates(options.posts, options.theme, options.primaryColor)
  const modalMarkup = generateBlogModalMarkup({
    surface: blogTokens.surface,
    text: blogTokens.text,
  })

  const moreLink = options.showAllLink
    ? `
<div class="hp-posts-more">
  <a href="${escapeHtml(options.blogHref)}" target="_parent" style="color:${options.primaryColor};">לכל הפוסטים</a>
</div>`
    : ''

  return `
<section class="hp-posts-section" id="posts">
<style>${HOMEPAGE_POSTS_CSS}${BLOG_MODAL_CSS}</style>
<div class="hp-posts-inner">
<div class="hp-posts-header">
<span class="hp-posts-eyebrow" style="color:${options.primaryColor};">${escapeHtml(t.eyebrow)}</span>
<h2 class="hp-posts-title" style="font-family:${t.titleFont};color:${t.text};">${escapeHtml(options.sectionTitle)}</h2>
<div class="hp-posts-divider" style="background:${options.primaryColor};"></div>
</div>
<div class="hp-posts-grid">
${cards}
</div>
${moreLink}
</div>
${templates}
${modalMarkup}
</section>
<script>${REVEAL_SCRIPT}</script>
<script>${BLOG_MODAL_INIT_SCRIPT}</script>`
}
