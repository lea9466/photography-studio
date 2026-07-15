import {
  buildPublicSiteChrome,
  generateSiteFooter,
  generateSiteNav,
  generateSiteNavMobileStyles,
  generateSiteNavScrollScript,
  generateSiteNavStyles,
  publicSiteLtrCss,
  publicSitePageHtmlAttrs,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'
import { homepageSectionHref, type PhotographerSiteTheme } from '@/lib/photographer-site-paths'
import {
  formatGalleryMetaLine,
  getPublicGalleryContactLabel,
  getPublicGalleryDefaultCta,
  getPublicGalleryLightboxCopy,
  getPublicGalleryPageTitleSuffix,
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
  portfolioPath?: string
  blogPath?: string
  gallery: PublicGalleryPageData
  hasFaq?: boolean
  hasPackages?: boolean
  hasBlog?: boolean
  shouldColorLogo?: boolean
  galleryLayoutMode?: 'separated' | 'portfolio'
  siteLanguage?: string | null
}) {
  const chromeTheme = toChromeTheme(options.theme)
  const primaryColor = options.gallery.accentColor
  const language = resolveSiteLanguage(options.siteLanguage)
  const pageTitleSuffix = getPublicGalleryPageTitleSuffix(language)
  const chrome = buildPublicSiteChrome({
    theme: chromeTheme,
    studioName: options.studioName,
    logoUrl: options.logoUrl,
    primaryColor,
    homepagePath: options.homepagePath,
    linkMode: 'href',
    hasFaq: options.hasFaq ?? false,
    hasPackages: options.hasPackages ?? false,
    hasBlog: options.hasBlog ?? false,
    blogPath: options.blogPath,
    shouldColorLogo: options.shouldColorLogo ?? false,
    galleryLayoutMode: options.galleryLayoutMode ?? 'separated',
    portfolioPath: options.portfolioPath,
    siteLanguage: options.siteLanguage,
  })

  return `<!DOCTYPE html>
<html ${publicSitePageHtmlAttrs(options.siteLanguage)} style="scroll-behavior: smooth;">
${themeHead(chromeTheme, options.studioName, primaryColor, options.shouldColorLogo ?? false, pageTitleSuffix, options.siteLanguage)}
${MASONRY_STYLES}
${generateSiteNav(chrome)}
${galleryBody(options.gallery, chromeTheme, options.homepagePath, language)}
${lightboxMarkup(language)}
${generateSiteFooter(chrome)}
<script>${generateSiteNavScrollScript(chromeTheme, 'href')}</script>
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
