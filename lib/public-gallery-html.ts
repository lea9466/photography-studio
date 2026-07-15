import {
  buildPublicSiteChrome,
  generateSiteNavMobileStyles,
  generateSiteNavStyles,
  publicSiteLtrCss,
  publicSitePageHtmlAttrs,
  type SiteChromeConfig,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'
import { homepageSectionHref, type PhotographerSiteTheme } from '@/lib/photographer-site-paths'
import {
  formatGalleryMetaLine,
  getPublicGalleryBackToStudioLabel,
  getPublicGalleryContactLabel,
  getPublicGalleryDefaultCta,
  getPublicGalleryFooterCopy,
  getPublicGalleryLightboxCopy,
  getPublicGalleryPageTitleSuffix,
  getPublicGalleryVisitWebsiteLabel,
} from '@/lib/public-gallery-copy'
import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

export type PublicGalleryPhoto = {
  id: string
  url: string | null
}

export type PublicContactCardData = {
  contactCardTitle: string | null
  contactCardDescription: string | null
}

export type PublicGalleryContactInfo = {
  phone: string | null
  email: string | null
  address: string | null
}

export type PublicGalleryPageData = {
  title: string
  photoCount: number
  galleryDate: string
  photos: PublicGalleryPhoto[]
  accentColor: string
  contactCardTitle: string | null
  contactCardDescription: string | null
}

function toChromeTheme(theme: PhotographerSiteTheme): SiteChromeTheme {
  return theme === 'bold' ? 'dark' : theme
}

const MASONRY_STYLES = `
<style>
.pg-masonry {
  column-count: 1;
  column-gap: 4px;
}
@media (min-width: 640px) { .pg-masonry { column-count: 2; } }
@media (min-width: 1024px) { .pg-masonry { column-count: 3; } }
.pg-masonry-cell {
  break-inside: avoid;
  margin-bottom: 4px;
  opacity: 0;
  transform: scale(0.82);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0, 0.2, 1);
  will-change: opacity, transform;
}
.pg-masonry-cell.is-visible {
  opacity: 1;
  transform: scale(1);
}
.pg-masonry-cell img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.7s ease-out;
  cursor: zoom-in;
}
.pg-masonry-cell:hover img { transform: scale(1.03); }
.pg-lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.95);
  padding: 1rem;
}
.pg-lightbox.is-open { display: flex; }
.pg-lightbox__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(1920px, calc(100vw - 2rem));
  height: min(88vh, calc(100vw - 2rem));
  max-width: 100%;
}
.pg-lightbox__image {
  display: block;
  max-width: 100%;
  max-height: min(88vh, calc(100vw - 2rem));
  width: auto;
  height: auto;
  object-fit: contain;
}
.pg-lightbox__close,
.pg-lightbox__nav {
  position: absolute;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}
.pg-lightbox__close:hover,
.pg-lightbox__nav:hover { background: rgba(0, 0, 0, 0.85); }
.pg-lightbox__close {
  top: 1rem;
  inset-inline-end: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  font-size: 1.5rem;
  line-height: 1;
}
.pg-lightbox__nav {
  top: 50%;
  transform: translateY(-50%);
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  font-size: 1.75rem;
  line-height: 1;
}
.pg-lightbox__nav--prev { inset-inline-start: 1rem; }
.pg-lightbox__nav--next { inset-inline-end: 1rem; }
.pg-lightbox__nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.pg-lightbox__counter {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.875rem;
}
</style>`

const masonryRevealScript = `
(function initMasonryReveal() {
  function boot() {
    var cells = [].slice.call(document.querySelectorAll('.pg-masonry-cell'));
    if (!cells.length) return;
    if (!('IntersectionObserver' in window)) {
      cells.forEach(function(c) { c.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var cell = entry.target;
        var delay = parseInt(cell.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function() { cell.classList.add('is-visible'); }, delay);
        observer.unobserve(cell);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    cells.forEach(function(c) { observer.observe(c); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`

function lightboxMarkup(language: SiteLanguage) {
  const copy = getPublicGalleryLightboxCopy(language)
  return `
<div id="pg-lightbox" class="pg-lightbox" aria-hidden="true">
  <button type="button" class="pg-lightbox__close" aria-label="${copy.close}">&times;</button>
  <button type="button" class="pg-lightbox__nav pg-lightbox__nav--prev" aria-label="${copy.prev}">&#8250;</button>
  <button type="button" class="pg-lightbox__nav pg-lightbox__nav--next" aria-label="${copy.next}">&#8249;</button>
  <div class="pg-lightbox__stage">
    <img id="pg-lightbox-image" class="pg-lightbox__image" alt="" />
  </div>
  <p id="pg-lightbox-counter" class="pg-lightbox__counter"></p>
</div>`
}

const lightboxScript = `
(function initPublicGalleryLightbox() {
  function boot() {
    var photos = [].slice.call(document.querySelectorAll('.pg-masonry-cell img[data-lightbox-src]'))
      .map(function(img) { return img.getAttribute('data-lightbox-src'); })
      .filter(Boolean);
    if (!photos.length) return;

    var lightbox = document.getElementById('pg-lightbox');
    var image = document.getElementById('pg-lightbox-image');
    var counter = document.getElementById('pg-lightbox-counter');
    var closeBtn = lightbox && lightbox.querySelector('.pg-lightbox__close');
    var prevBtn = lightbox && lightbox.querySelector('.pg-lightbox__nav--prev');
    var nextBtn = lightbox && lightbox.querySelector('.pg-lightbox__nav--next');
    if (!lightbox || !image || !counter || !closeBtn || !prevBtn || !nextBtn) return;

    var currentIndex = 0;

    function render() {
      image.src = photos[currentIndex];
      counter.textContent = (currentIndex + 1) + ' / ' + photos.length;
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex >= photos.length - 1;
    }

    function open(index) {
      currentIndex = index;
      render();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      image.removeAttribute('src');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.pg-masonry-cell img[data-lightbox-src]').forEach(function(img, index) {
      img.addEventListener('click', function() { open(index); });
    });

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function(event) {
      if (event.target === lightbox) close();
    });
    prevBtn.addEventListener('click', function() {
      if (currentIndex > 0) {
        currentIndex -= 1;
        render();
      }
    });
    nextBtn.addEventListener('click', function() {
      if (currentIndex < photos.length - 1) {
        currentIndex += 1;
        render();
      }
    });
    document.addEventListener('keydown', function(event) {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight' && currentIndex > 0) {
        currentIndex -= 1;
        render();
      }
      if (event.key === 'ArrowLeft' && currentIndex < photos.length - 1) {
        currentIndex += 1;
        render();
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

const lightboxDelegationScript = `
(function initPublicGalleryLightboxDelegation() {
  function boot() {
    var lightbox = document.getElementById('pg-lightbox');
    var image = document.getElementById('pg-lightbox-image');
    var counter = document.getElementById('pg-lightbox-counter');
    var closeBtn = lightbox && lightbox.querySelector('.pg-lightbox__close');
    var prevBtn = lightbox && lightbox.querySelector('.pg-lightbox__nav--prev');
    var nextBtn = lightbox && lightbox.querySelector('.pg-lightbox__nav--next');
    if (!lightbox || !image || !counter || !closeBtn || !prevBtn || !nextBtn) return;

    var photos = [];
    var currentIndex = 0;

    function collectPhotos() {
      return [].slice.call(document.querySelectorAll('.pg-masonry-cell'))
        .filter(function(cell) { return cell.style.display !== 'none'; })
        .map(function(cell) {
          var img = cell.querySelector('img[data-lightbox-src]');
          return img ? img.getAttribute('data-lightbox-src') : null;
        })
        .filter(Boolean);
    }

    function render() {
      image.src = photos[currentIndex];
      counter.textContent = (currentIndex + 1) + ' / ' + photos.length;
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex >= photos.length - 1;
    }

    function open(index) {
      photos = collectPhotos();
      if (!photos.length) return;
      currentIndex = index;
      render();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      image.removeAttribute('src');
      document.body.style.overflow = '';
    }

    document.addEventListener('click', function(event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var img = target.closest('.pg-masonry-cell img[data-lightbox-src]');
      if (!img) return;
      photos = collectPhotos();
      var url = img.getAttribute('data-lightbox-src');
      var index = photos.indexOf(url);
      if (index >= 0) open(index);
    });

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function(event) {
      if (event.target === lightbox) close();
    });
    prevBtn.addEventListener('click', function() {
      if (currentIndex > 0) {
        currentIndex -= 1;
        render();
      }
    });
    nextBtn.addEventListener('click', function() {
      if (currentIndex < photos.length - 1) {
        currentIndex += 1;
        render();
      }
    });
    document.addEventListener('keydown', function(event) {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight' && currentIndex > 0) {
        currentIndex -= 1;
        render();
      }
      if (event.key === 'ArrowLeft' && currentIndex < photos.length - 1) {
        currentIndex += 1;
        render();
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const MASONRY_CELL_STYLE: Record<SiteChromeTheme, { radius: string; bg: string; extra: string }> = {
  elegant: { radius: '0px', bg: '#eae8e5', extra: '' },
  classic: { radius: '0px', bg: '#eae8e5', extra: '' },
  modern: { radius: '0px', bg: '#eae8e5', extra: '' },
  dark: { radius: '0px', bg: '#1A1A22', extra: '' },
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function photoGrid(photos: PublicGalleryPhoto[], title: string, theme: SiteChromeTheme) {
  const cfg = MASONRY_CELL_STYLE[theme]
  return photos
    .map((photo, index) => {
      if (!photo.url) return ''
      const alt = escapeHtml(`${title} - ${index + 1}`)
      const url = escapeHtml(photo.url)
      const delay = (index % 4) * 90
      return `
<div class="pg-masonry-cell group" style="border-radius:${cfg.radius};background:${cfg.bg};overflow:hidden;${cfg.extra}" data-reveal-delay="${delay}">
  <img src="${url}" data-lightbox-src="${url}" alt="${alt}" loading="lazy" />
</div>`
    })
    .join('')
}

function contactButton(theme: SiteChromeTheme, homepagePath: string, language: SiteLanguage) {
  const href = escapeHtml(homepageSectionHref(homepagePath, 'contact'))
  const label = getPublicGalleryContactLabel(language)
  const dir = language === 'en' ? 'ltr' : 'rtl'
  const btnStyle = `direction: ${dir} !important; text-align: center !important;`

  if (theme === 'dark') {
    return `<a href="${href}" target="_parent" class="inline-block bg-primary text-on-primary px-xl py-md font-label-sm uppercase tracking-widest hover:opacity-90 btn-fuchsia-transition" style="${btnStyle}">${label}</a>`
  }

  if (theme === 'classic') {
    return `<a href="${href}" target="_parent" class="inline-block border border-primary text-primary px-xl py-md font-label-sm hover:bg-primary/5 transition-colors" style="${btnStyle}">${label}</a>`
  }

  if (theme === 'modern') {
    return `<a href="${href}" target="_parent" class="inline-block bg-primary text-white px-xl py-md rounded-lg font-bold hover:brightness-110 transition-all" style="${btnStyle}">${label}</a>`
  }

  return `<a href="${href}" target="_parent" class="inline-block border border-[#0F0F0D] px-8 py-4 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all" style="${btnStyle}">${label}</a>`
}

export function generatePublicContactCardSection(
  data: PublicContactCardData,
  theme: SiteChromeTheme,
  homepagePath: string,
  language: SiteLanguage
) {
  const defaults = getPublicGalleryDefaultCta(language)
  const title = escapeHtml(data.contactCardTitle || defaults.title)
  const description = escapeHtml(data.contactCardDescription || defaults.description)
  const button = contactButton(theme, homepagePath, language)

  if (theme === 'dark') {
    return `
<section class="py-[80px] bg-[#121217] border-t border-white/5">
  <div class="max-w-[1280px] mx-auto px-[24px] text-center">
    <h2 class="font-headline-md text-headline-md text-on-surface mb-[24px]">${title}</h2>
    <p class="font-body-md text-body-md text-on-surface-variant mb-[48px] max-w-xl mx-auto" style="white-space: pre-line">${description}</p>
    ${button}
  </div>
</section>`
  }

  if (theme === 'classic') {
    return `
<section class="py-[80px] bg-[#f6f3f0] border-y border-[#d6c3bb]/20">
  <div class="max-w-[1280px] mx-auto px-[24px] text-center">
    <h2 class="font-headline-md text-headline-md mb-[24px]">${title}</h2>
    <p class="font-body-md text-body-md text-on-surface-variant mb-[48px] max-w-xl mx-auto" style="white-space: pre-line">${description}</p>
    ${button}
  </div>
</section>`
  }

  if (theme === 'modern') {
    return `
<section class="max-w-[1280px] mx-auto px-[24px] mb-[80px]">
  <div class="relative bg-[#2D2825] text-white rounded-xl p-[32px] overflow-hidden shadow-lg text-center">
    <h2 class="font-headline text-[32px] font-bold mb-[12px]">${title}</h2>
    <p class="text-[14px] text-[#e5e2df] mb-[32px] opacity-80" style="white-space: pre-line">${description}</p>
    ${button}
  </div>
</section>`
  }

  return `
<section class="py-[80px] bg-[#f6f3f0] border-y border-[#d6c3bb]/20">
  <div class="max-w-[1280px] mx-auto px-[24px] text-center">
    <h2 class="font-serif-hebrew text-[36px] mb-[24px] font-medium">${title}</h2>
    <p class="font-body text-[16px] text-[#5A504A] mb-[48px] max-w-xl mx-auto" style="white-space: pre-line">${description}</p>
    ${button}
  </div>
</section>`
}

const GALLERY_CHROME_STYLES = `
<style>
.pg-gallery-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--pg-nav-border);
  background: var(--pg-nav-bg);
  color: var(--pg-nav-text);
}
.pg-gallery-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
  text-decoration: none;
  color: inherit;
}
.pg-gallery-nav__brand:hover { opacity: 0.85; }
.pg-gallery-nav__logo {
  height: 2.25rem;
  width: auto;
  max-width: 9rem;
  object-fit: contain;
}
.pg-gallery-nav__name {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pg-gallery-nav__back {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid var(--pg-nav-back-border);
  background: var(--pg-nav-back-bg);
  color: var(--pg-nav-back-text);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.pg-gallery-nav__back:hover {
  background: var(--pg-nav-back-hover-bg);
  border-color: var(--pg-nav-back-hover-border);
}
.pg-gallery-studio-footer {
  border-top: 1px solid var(--pg-footer-border);
  background: var(--pg-footer-bg);
  color: var(--pg-footer-text);
  padding: 2.5rem 1.5rem 3rem;
}
.pg-gallery-studio-footer__inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}
.pg-gallery-studio-footer__brand {
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.pg-gallery-studio-footer__details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--pg-footer-muted);
}
.pg-gallery-studio-footer__detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.pg-gallery-studio-footer__detail a {
  color: inherit;
  text-decoration: none;
}
.pg-gallery-studio-footer__detail a:hover {
  color: var(--pg-footer-accent);
}
.pg-gallery-studio-footer__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}
.pg-gallery-studio-footer__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-decoration: none;
  transition: opacity 0.2s ease, background 0.2s ease;
}
.pg-gallery-studio-footer__btn--primary {
  background: var(--pg-footer-accent);
  color: var(--pg-footer-accent-text);
}
.pg-gallery-studio-footer__btn--primary:hover { opacity: 0.9; }
.pg-gallery-studio-footer__btn--secondary {
  border: 1px solid var(--pg-footer-border);
  color: var(--pg-footer-text);
}
.pg-gallery-studio-footer__btn--secondary:hover {
  border-color: var(--pg-footer-accent);
  color: var(--pg-footer-accent);
}
.pg-gallery-nav--elegant {
  --pg-nav-bg: rgba(250, 250, 248, 0.94);
  --pg-nav-border: rgba(15, 15, 13, 0.08);
  --pg-nav-text: #0F0F0D;
  --pg-nav-back-border: rgba(15, 15, 13, 0.14);
  --pg-nav-back-bg: transparent;
  --pg-nav-back-text: #0F0F0D;
  --pg-nav-back-hover-bg: rgba(15, 15, 13, 0.04);
  --pg-nav-back-hover-border: rgba(15, 15, 13, 0.24);
}
.pg-gallery-nav--modern {
  --pg-nav-bg: rgba(248, 250, 252, 0.94);
  --pg-nav-border: rgba(203, 213, 225, 0.6);
  --pg-nav-text: #0F172A;
  --pg-nav-back-border: rgba(15, 23, 42, 0.12);
  --pg-nav-back-bg: #fff;
  --pg-nav-back-text: #0F172A;
  --pg-nav-back-hover-bg: #f8fafc;
  --pg-nav-back-hover-border: rgba(15, 23, 42, 0.2);
}
.pg-gallery-nav--classic {
  --pg-nav-bg: rgba(250, 250, 248, 0.94);
  --pg-nav-border: rgba(214, 211, 209, 0.7);
  --pg-nav-text: #1c1917;
  --pg-nav-back-border: rgba(28, 25, 23, 0.12);
  --pg-nav-back-bg: #fff;
  --pg-nav-back-text: #1c1917;
  --pg-nav-back-hover-bg: #fafaf8;
  --pg-nav-back-hover-border: rgba(28, 25, 23, 0.22);
}
.pg-gallery-nav--dark {
  --pg-nav-bg: rgba(18, 18, 23, 0.94);
  --pg-nav-border: rgba(255, 255, 255, 0.08);
  --pg-nav-text: #F5F5F0;
  --pg-nav-back-border: rgba(255, 255, 255, 0.14);
  --pg-nav-back-bg: rgba(255, 255, 255, 0.04);
  --pg-nav-back-text: #F5F5F0;
  --pg-nav-back-hover-bg: rgba(255, 255, 255, 0.08);
  --pg-nav-back-hover-border: rgba(255, 255, 255, 0.22);
}
.pg-gallery-studio-footer--elegant {
  --pg-footer-bg: #FAFAF8;
  --pg-footer-border: rgba(15, 15, 13, 0.08);
  --pg-footer-text: #0F0F0D;
  --pg-footer-muted: #5A504A;
  --pg-footer-accent: var(--pg-accent, #7c3aed);
  --pg-footer-accent-text: #fff;
}
.pg-gallery-studio-footer--modern {
  --pg-footer-bg: #F8FAFC;
  --pg-footer-border: rgba(203, 213, 225, 0.6);
  --pg-footer-text: #0F172A;
  --pg-footer-muted: #475569;
  --pg-footer-accent: var(--pg-accent, #7c3aed);
  --pg-footer-accent-text: #fff;
}
.pg-gallery-studio-footer--classic {
  --pg-footer-bg: #FAFAF8;
  --pg-footer-border: rgba(214, 211, 209, 0.7);
  --pg-footer-text: #1c1917;
  --pg-footer-muted: #57534e;
  --pg-footer-accent: var(--pg-accent, #7c3aed);
  --pg-footer-accent-text: #fff;
}
.pg-gallery-studio-footer--dark {
  --pg-footer-bg: #121217;
  --pg-footer-border: rgba(255, 255, 255, 0.08);
  --pg-footer-text: #F5F5F0;
  --pg-footer-muted: #B8B8C0;
  --pg-footer-accent: var(--pg-accent, #7c3aed);
  --pg-footer-accent-text: #fff;
}
@media (min-width: 768px) {
  .pg-gallery-nav { padding: 0.875rem 2rem; }
  .pg-gallery-nav__name { font-size: 1rem; }
  .pg-gallery-nav__back { font-size: 0.8125rem; padding: 0.5rem 1rem; }
}
</style>`

function galleryChromeThemeVars(theme: SiteChromeTheme, primaryColor: string) {
  return `<style>:root { --pg-accent: ${primaryColor}; }</style>`
}

function generatePublicGalleryMinimalNav(cfg: SiteChromeConfig, language: SiteLanguage) {
  const homeHref = escapeHtml(cfg.homepagePath)
  const backLabel = escapeHtml(getPublicGalleryBackToStudioLabel(language))
  const studioName = escapeHtml(cfg.studioName)
  const brandInner = cfg.logoUrl
    ? `<img src="${escapeHtml(cfg.logoUrl)}" alt="${studioName}" class="pg-gallery-nav__logo" />`
    : `<span class="pg-gallery-nav__name">${studioName}</span>`

  return `
<header class="pg-gallery-nav pg-gallery-nav--${cfg.theme}" id="pg-gallery-nav">
  <a href="${homeHref}" target="_parent" class="pg-gallery-nav__brand">${brandInner}</a>
  <a href="${homeHref}" target="_parent" class="pg-gallery-nav__back" aria-label="${backLabel}">${backLabel}</a>
</header>`
}

function generatePublicGalleryStudioFooter(
  cfg: SiteChromeConfig,
  contact: PublicGalleryContactInfo,
  language: SiteLanguage
) {
  const footerCopy = getPublicGalleryFooterCopy(language)
  const homeHref = escapeHtml(cfg.homepagePath)
  const contactHref = escapeHtml(homepageSectionHref(cfg.homepagePath, 'contact'))
  const studioName = escapeHtml(cfg.studioName)
  const bookLabel = escapeHtml(footerCopy.bookSession)
  const visitLabel = escapeHtml(getPublicGalleryVisitWebsiteLabel(language))

  const detailLines: string[] = []
  if (contact.phone) {
    const phone = escapeHtml(contact.phone)
    const tel = escapeHtml(contact.phone.replace(/\s+/g, ''))
    detailLines.push(
      `<div class="pg-gallery-studio-footer__detail"><span>${escapeHtml(footerCopy.phone)}:</span> <a href="tel:${tel}">${phone}</a></div>`
    )
  }
  if (contact.email) {
    const email = escapeHtml(contact.email)
    detailLines.push(
      `<div class="pg-gallery-studio-footer__detail"><span>${escapeHtml(footerCopy.email)}:</span> <a href="mailto:${email}">${email}</a></div>`
    )
  }
  if (contact.address) {
    detailLines.push(
      `<div class="pg-gallery-studio-footer__detail"><span>${escapeHtml(footerCopy.address)}:</span> <span>${escapeHtml(contact.address)}</span></div>`
    )
  }

  const detailsBlock =
    detailLines.length > 0
      ? `<div class="pg-gallery-studio-footer__details">${detailLines.join('')}</div>`
      : ''

  return `
<footer class="pg-gallery-studio-footer pg-gallery-studio-footer--${cfg.theme}">
  <div class="pg-gallery-studio-footer__inner">
    <div class="pg-gallery-studio-footer__brand">${studioName}</div>
    ${detailsBlock}
    <div class="pg-gallery-studio-footer__actions">
      <a href="${contactHref}" target="_parent" class="pg-gallery-studio-footer__btn pg-gallery-studio-footer__btn--primary">${bookLabel}</a>
      <a href="${homeHref}" target="_parent" class="pg-gallery-studio-footer__btn pg-gallery-studio-footer__btn--secondary">${visitLabel}</a>
    </div>
  </div>
</footer>`
}

function galleryBody(
  data: PublicGalleryPageData,
  theme: SiteChromeTheme,
  homepagePath: string,
  language: SiteLanguage
) {
  const title = escapeHtml(data.title)
  const meta = escapeHtml(formatGalleryMetaLine(data.photoCount, data.galleryDate, language))

  if (theme === 'elegant') {
    return `
<main class="pt-24">
<section class="max-w-[1280px] mx-auto px-[24px] pt-8">
<header class="text-center mb-[80px]">
<span class="text-[13px] uppercase tracking-[0.2em] mb-[16px] block elegant-accent">Aesthetic Collection</span>
<h1 class="font-serif-hebrew text-[48px] md:text-[68px] text-on-surface mb-[16px] font-medium">${title}</h1>
<div class="w-16 h-px mx-auto mb-[24px] elegant-bg-accent"></div>
<p class="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto">${meta}</p>
</header>
</section>
<section class="pg-masonry px-1 sm:px-1.5 mb-[80px]">
${photoGrid(data.photos, data.title, theme)}
</section>
<section class="max-w-[1280px] mx-auto px-[24px] pb-24">
${generatePublicContactCardSection(data, theme, homepagePath, language)}
</section>
</main>`
  }

  if (theme === 'classic') {
    return `
<main class="pt-24">
<section class="max-w-[1280px] mx-auto px-[24px] pt-8">
<header class="text-center mb-[48px]">
<span class="text-[13px] uppercase tracking-[0.2em] mb-[16px] block text-primary">Editorial Series</span>
<h1 class="font-headline-md text-headline-md text-on-surface mb-[16px]">${title}</h1>
<div class="w-12 h-px mx-auto mb-[24px] bg-primary"></div>
<p class="font-body-md text-body-md text-on-surface-variant italic">${meta}</p>
</header>
</section>
<section class="pg-masonry px-1 sm:px-1.5 mb-[80px]">
${photoGrid(data.photos, data.title, theme)}
</section>
<section class="max-w-[1280px] mx-auto px-[24px] pb-24">
${generatePublicContactCardSection(data, theme, homepagePath, language)}
</section>
</main>`
  }

  if (theme === 'dark') {
    return `
<main class="pt-24">
<section class="max-w-[1280px] mx-auto px-[24px] py-24">
<header class="text-center mb-[48px]">
<span class="text-primary font-label-sm tracking-[0.2em] block mb-[16px] uppercase">Portfolio</span>
<h1 class="font-headline-md text-headline-md text-on-surface mb-[16px]">${title}</h1>
<p class="font-body-md text-body-md text-on-surface-variant">${meta}</p>
</header>
</section>
<section class="pg-masonry px-1 sm:px-1.5 mb-[80px]">
${photoGrid(data.photos, data.title, theme)}
</section>
<section class="max-w-[1280px] mx-auto px-[24px] pb-24">
${generatePublicContactCardSection(data, theme, homepagePath, language)}
</section>
</main>`
  }

  return `
<main class="pt-24">
<section class="max-w-[1280px] mx-auto px-[24px] py-24">
<header class="text-right mb-[32px] py-[24px]">
<h1 class="font-headline text-[48px] md:text-[64px] font-bold text-on-surface leading-tight mb-[8px]">${title}</h1>
<p class="font-body text-[16px] text-on-surface-variant">${meta}</p>
</header>
</section>
<section class="pg-masonry px-1 sm:px-1.5 mb-[80px]">
${photoGrid(data.photos, data.title, theme)}
</section>
<section class="max-w-[1280px] mx-auto px-[24px] pb-24">
${generatePublicContactCardSection(data, theme, homepagePath, language)}
</section>
</main>`
}

function themeHead(
  theme: SiteChromeTheme,
  studioName: string,
  primaryColor: string,
  shouldColorLogo: boolean = false,
  pageTitleSuffix = 'גלריה',
  siteLanguage?: string | null
) {
  const title = escapeHtml(`${studioName} | ${pageTitleSuffix}`)
  const ltrCss = publicSiteLtrCss(siteLanguage)

  if (theme === 'modern') {
    return `
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${title}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "${primaryColor}",
        background: "#F8FAFC",
        "on-surface": "#0F172A",
        "on-surface-variant": "#475569",
        "outline-variant": "#cbd5e1",
        "surface-container": "#f1f5f9",
        "surface-variant": "#e2e8f0",
      },
      spacing: { xl: "48px", md: "16px", lg: "24px" },
      fontFamily: { headline: ["Space Grotesk", "Heebo", "sans-serif"] },
    },
  },
};
</script>
<style>
body { font-family: 'Heebo', sans-serif; background: #F8FAFC; color: #0F172A; }
.font-headline { font-family: 'Space Grotesk', 'Heebo', sans-serif; }
.nav-glass { background: rgba(248, 250, 252, 0.8); backdrop-filter: blur(12px); }
${generateSiteNavStyles(theme, primaryColor, shouldColorLogo)}
${ltrCss}
</style>
</head>
<body class="bg-background text-on-surface overflow-x-hidden">`
  }

  if (theme === 'classic') {
    return `
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${title}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@400;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "${primaryColor}",
        surface: "#FAFAF8",
        "on-surface": "#1c1917",
        "on-surface-variant": "#57534e",
        "outline-variant": "#d6d3d1",
        "surface-container-highest": "#f5f0eb",
      },
      spacing: { lg: "24px", md: "16px", xl: "48px", xxl: "80px" },
      fontSize: {
        "headline-md": ["36px", { lineHeight: "1.2", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6" }],
        "label-sm": ["13px", { lineHeight: "1" }],
      },
      fontFamily: {
        "headline-sm": ["Frank Ruhl Libre", "serif"],
        "body-md": ["Heebo", "sans-serif"],
        "label-sm": ["Heebo", "sans-serif"],
      },
    },
  },
};
</script>
<style>
body { font-family: 'Heebo', sans-serif; background: #FAFAF8; }
${generateSiteNavStyles(theme, primaryColor, shouldColorLogo)}
${ltrCss}
</style>
</head>
<body class="bg-surface text-on-surface overflow-x-hidden">`
  }

  if (theme === 'dark') {
    return `
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${title}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "${primaryColor}",
        background: "#121217",
        "on-surface": "#F5F5F0",
        "on-surface-variant": "#B8B8C0",
        "surface-dim": "#0D0D12",
      },
      spacing: { lg: "24px", md: "16px", xl: "48px" },
      fontSize: {
        "headline-md": ["36px", { lineHeight: "1.1", fontWeight: "600" }],
        "headline-sm": ["24px", { lineHeight: "1.1", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6" }],
        "label-sm": ["13px", { lineHeight: "1" }],
      },
    },
  },
};
</script>
<style>
body { font-family: 'Heebo', sans-serif; background: #121217; color: #F5F5F0; }
.btn-fuchsia-transition { transition: color 0.3s ease; }
${generateSiteNavStyles(theme, primaryColor, shouldColorLogo)}
${ltrCss}
</style>
</head>
<body class="bg-background text-on-surface">`
  }

  return `
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${title}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "${primaryColor}",
        accent: "${primaryColor}",
        background: "#FAFAF8",
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#464742",
        "outline-variant": "#c7c7c0",
      },
      spacing: { lg: "24px", md: "16px", xl: "32px", "margin-mobile": "16px", "margin-desktop": "64px" },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Heebo", "sans-serif"],
        "serif-hebrew": ["Frank Ruhl Libre", "serif"],
      },
    },
  },
};
</script>
<style>
body { background: #FAFAF8; color: #0F0F0D; font-family: 'Heebo', sans-serif; }
.elegant-accent { color: ${primaryColor}; }
.elegant-bg-accent { background-color: ${primaryColor}; }
.font-serif-hebrew { font-family: 'Frank Ruhl Libre', serif; }
.font-display { font-family: 'Playfair Display', serif; }
.font-body { font-family: 'Heebo', sans-serif; }
${generateSiteNavStyles('elegant', primaryColor, shouldColorLogo)}
${generateSiteNavMobileStyles()}
${ltrCss}
</style>
</head>
<body class="selection:bg-[${primaryColor}] selection:text-white">`
}

export function generatePublicGalleryPageHTML(options: {
  theme: PhotographerSiteTheme
  studioName: string
  logoUrl: string | null
  homepagePath: string
  gallery: PublicGalleryPageData
  contact?: PublicGalleryContactInfo
  hasFaq?: boolean
  hasPackages?: boolean
  shouldColorLogo?: boolean
  siteLanguage?: string | null
}) {
  const chromeTheme = toChromeTheme(options.theme)
  const primaryColor = options.gallery.accentColor
  const language = resolveSiteLanguage(options.siteLanguage)
  const pageTitleSuffix = getPublicGalleryPageTitleSuffix(language)
  const contact = options.contact ?? { phone: null, email: null, address: null }
  const chrome = buildPublicSiteChrome({
    theme: chromeTheme,
    studioName: options.studioName,
    logoUrl: options.logoUrl,
    primaryColor,
    homepagePath: options.homepagePath,
    linkMode: 'href',
    hasFaq: options.hasFaq ?? false,
    hasPackages: options.hasPackages ?? false,
    shouldColorLogo: options.shouldColorLogo ?? false,
    siteLanguage: options.siteLanguage,
  })

  return `<!DOCTYPE html>
<html ${publicSitePageHtmlAttrs(options.siteLanguage)} style="scroll-behavior: smooth;">
${themeHead(chromeTheme, options.studioName, primaryColor, options.shouldColorLogo ?? false, pageTitleSuffix, options.siteLanguage)}
${galleryChromeThemeVars(chromeTheme, primaryColor)}
${GALLERY_CHROME_STYLES}
${MASONRY_STYLES}
${generatePublicGalleryMinimalNav(chrome, language)}
${galleryBody(options.gallery, chromeTheme, options.homepagePath, language)}
${lightboxMarkup(language)}
${generatePublicGalleryStudioFooter(chrome, contact, language)}
<script>${masonryRevealScript}</script>
<script>${lightboxScript}</script>
</body>
</html>`
}

export function generatePublicGalleryThemeHead(
  theme: SiteChromeTheme,
  studioName: string,
  primaryColor: string,
  pageTitleSuffix = 'גלריה',
  shouldColorLogo = false,
  siteLanguage?: string | null
) {
  return themeHead(theme, studioName, primaryColor, shouldColorLogo, pageTitleSuffix, siteLanguage)
}

export function getMasonryCellStyle(theme: SiteChromeTheme) {
  return MASONRY_CELL_STYLE[theme]
}

export function generatePublicGalleryMasonryGrid(
  photos: Array<{ id: string; url: string | null; galleryName?: string }>,
  title: string,
  theme: SiteChromeTheme
) {
  const cfg = MASONRY_CELL_STYLE[theme]
  return photos
    .map((photo, index) => {
      if (!photo.url) return ''
      const alt = escapeHtml(`${title} - ${index + 1}`)
      const url = escapeHtml(photo.url)
      const delay = (index % 4) * 90
      const galleryAttr = photo.galleryName
        ? ` data-gallery-name="${escapeAttr(photo.galleryName)}"`
        : ''
      return `
<div class="pg-masonry-cell group"${galleryAttr} style="border-radius:${cfg.radius};background:${cfg.bg};overflow:hidden;${cfg.extra}" data-reveal-delay="${delay}">
  <img src="${url}" data-lightbox-src="${url}" alt="${alt}" loading="lazy" />
</div>`
    })
    .join('')
}

export {
  MASONRY_STYLES as PUBLIC_GALLERY_MASONRY_STYLES,
  masonryRevealScript as PUBLIC_GALLERY_MASONRY_REVEAL_SCRIPT,
  lightboxMarkup as generatePublicGalleryLightboxMarkup,
  lightboxScript as PUBLIC_GALLERY_LIGHTBOX_SCRIPT,
  lightboxDelegationScript as PUBLIC_GALLERY_LIGHTBOX_DELEGATION_SCRIPT,
}
