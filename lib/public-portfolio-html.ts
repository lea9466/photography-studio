import {
  createSiteChromeConfig,
  generateSiteFooter,
  generateSiteNav,
  generateSiteNavScrollScript,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'
import {
  generatePublicGalleryThemeHead,
  getMasonryCellStyle,
  PUBLIC_GALLERY_LIGHTBOX_DELEGATION_SCRIPT,
  PUBLIC_GALLERY_LIGHTBOX_MARKUP,
  PUBLIC_GALLERY_MASONRY_STYLES,
} from '@/lib/public-gallery-html'
import type { PhotographerSiteTheme } from '@/lib/photographer-site-paths'

export type PortfolioPhoto = {
  id: string
  url: string
  galleryId: string
  galleryName: string
}

export type PublicPortfolioPageData = {
  pageTitle: string
  photos: PortfolioPhoto[]
  galleryNames: string[]
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

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function generatePortfolioTabStyles(primaryColor: string) {
  return `
<style>
.portfolio-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}
.portfolio-tab {
  border: 1px solid ${primaryColor}66;
  background: transparent;
  color: ${primaryColor};
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  opacity: 0.85;
}
.portfolio-tab:hover {
  border-color: ${primaryColor};
  opacity: 1;
}
.portfolio-tab.is-active {
  background: ${primaryColor};
  border-color: ${primaryColor};
  color: #fff;
  opacity: 1;
}
.portfolio-tab--elegant { border-radius: 0; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.75rem; }
.portfolio-tab--modern { border-radius: 9999px; }
.portfolio-tab--classic { border-radius: 4px; }
.portfolio-tab--dark { border-radius: 2px; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.75rem; }
.portfolio-photo-count { color: ${primaryColor}; }
#portfolio-load-sentinel { break-inside: avoid; width: 100%; height: 1px; }
.portfolio-load-status {
  text-align: center;
  color: ${primaryColor};
  font-size: 0.875rem;
  opacity: 0.75;
  padding: 1rem 0 0;
}
</style>`
}

const PORTFOLIO_BATCH_SIZE = 20

function generatePortfolioPhotosDataScript(photos: PortfolioPhoto[]) {
  const payload = photos.map((photo) => ({
    id: photo.id,
    url: photo.url,
    galleryName: photo.galleryName,
  }))
  return `<script type="application/json" id="portfolio-photos-data">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`
}

function generatePortfolioLazyLoadScript(pageTitle: string, theme: SiteChromeTheme) {
  const cellStyle = getMasonryCellStyle(theme)
  return `
(function initPortfolioLazyLoad() {
  var BATCH_SIZE = ${PORTFOLIO_BATCH_SIZE};
  var pageTitle = ${JSON.stringify(pageTitle)};
  var cellStyle = ${JSON.stringify(cellStyle)};
  var dataEl = document.getElementById('portfolio-photos-data');
  var masonry = document.getElementById('portfolio-masonry');
  var sentinel = document.getElementById('portfolio-load-sentinel');
  var statusEl = document.getElementById('portfolio-load-status');
  if (!dataEl || !masonry || !sentinel) return;

  var allPhotos = [];
  try {
    allPhotos = JSON.parse(dataEl.textContent || '[]');
  } catch (error) {
    allPhotos = [];
  }

  var activeFilter = '__all__';
  var nextIndex = 0;
  var loading = false;
  var revealObserver = null;
  var loadObserver = null;

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function getFilteredPhotos() {
    if (activeFilter === '__all__') return allPhotos;
    return allPhotos.filter(function(photo) {
      return photo.galleryName === activeFilter;
    });
  }

  function observeCells(cells) {
    if (!cells.length) return;
    if (!('IntersectionObserver' in window)) {
      cells.forEach(function(cell) { cell.classList.add('is-visible'); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          var cell = entry.target;
          var delay = parseInt(cell.getAttribute('data-reveal-delay') || '0', 10);
          setTimeout(function() { cell.classList.add('is-visible'); }, delay);
          revealObserver.unobserve(cell);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    }
    cells.forEach(function(cell) { revealObserver.observe(cell); });
  }

  function createCell(photo, globalIndex) {
    var delay = (globalIndex % 4) * 90;
    var galleryAttr = photo.galleryName
      ? ' data-gallery-name="' + escapeAttr(photo.galleryName) + '"'
      : '';
    return '<div class="pg-masonry-cell group"' + galleryAttr +
      ' style="border-radius:' + cellStyle.radius + ';background:' + cellStyle.bg + ';overflow:hidden;' + cellStyle.extra + '" data-reveal-delay="' + delay + '">' +
      '<img src="' + escapeAttr(photo.url) + '" data-lightbox-src="' + escapeAttr(photo.url) + '" alt="' + escapeAttr(pageTitle + ' - ' + (globalIndex + 1)) + '" loading="lazy" decoding="async" />' +
      '</div>';
  }

  function updateStatus(filteredCount) {
    if (!statusEl) return;
    if (!filteredCount) {
      statusEl.textContent = 'אין תמונות להצגה';
      return;
    }
    if (nextIndex >= filteredCount) {
      statusEl.textContent = '';
      return;
    }
    statusEl.textContent = 'טוען תמונות...';
  }

  function clearCells() {
    var cells = masonry.querySelectorAll('.pg-masonry-cell');
    cells.forEach(function(cell) { cell.remove(); });
  }

  function renderBatch() {
    if (loading) return;
    var filtered = getFilteredPhotos();
    if (nextIndex >= filtered.length) {
      updateStatus(filtered.length);
      return;
    }

    loading = true;
    updateStatus(filtered.length);

    var batch = filtered.slice(nextIndex, nextIndex + BATCH_SIZE);
    nextIndex += batch.length;

    var fragment = document.createDocumentFragment();
    var newCells = [];
    batch.forEach(function(photo, batchIndex) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = createCell(photo, nextIndex - batch.length + batchIndex);
      var cell = wrapper.firstElementChild;
      if (cell) {
        fragment.appendChild(cell);
        newCells.push(cell);
      }
    });

    masonry.insertBefore(fragment, sentinel);
    observeCells(newCells);
    loading = false;
    updateStatus(filtered.length);

    if (nextIndex < filtered.length && loadObserver) {
      loadObserver.observe(sentinel);
    }
  }

  function resetGrid(filter) {
    activeFilter = filter || '__all__';
    nextIndex = 0;
    loading = false;
    clearCells();
    renderBatch();
  }

  function initTabs() {
    var tabs = document.querySelectorAll('.portfolio-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(item) { item.classList.remove('is-active'); });
        tab.classList.add('is-active');
        resetGrid(tab.getAttribute('data-filter') || '__all__');
      });
    });
  }

  function initLoadObserver() {
    if (!('IntersectionObserver' in window)) {
      while (nextIndex < getFilteredPhotos().length) renderBatch();
      return;
    }
    loadObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting || loading) return;
        loadObserver.unobserve(sentinel);
        renderBatch();
      });
    }, { rootMargin: '600px 0px 600px 0px', threshold: 0 });
    loadObserver.observe(sentinel);
  }

  function boot() {
    initTabs();
    resetGrid('__all__');
    initLoadObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`
}

function generateTabButtons(galleryNames: string[], theme: SiteChromeTheme) {
  const tabClass = `portfolio-tab portfolio-tab--${theme}`
  const allTab = `<button type="button" class="${tabClass} is-active" data-filter="__all__">הכל</button>`
  const galleryTabs = galleryNames
    .map(
      (name) =>
        `<button type="button" class="${tabClass}" data-filter="${escapeAttr(name)}">${escapeHtml(name)}</button>`
    )
    .join('\n')
  return allTab + galleryTabs
}

function portfolioHeader(theme: SiteChromeTheme, pageTitle: string, photoCount: number) {
  const title = escapeHtml(pageTitle)
  const meta = `${photoCount} תמונות`

  if (theme === 'elegant') {
    return `
<header class="text-center mb-[80px]">
<span class="text-[13px] uppercase tracking-[0.2em] mb-[16px] block elegant-accent">Portfolio</span>
<h1 class="font-serif-hebrew text-[48px] md:text-[68px] text-on-surface mb-[16px] font-medium">${title}</h1>
<div class="w-16 h-px mx-auto mb-[24px] elegant-bg-accent"></div>
<p class="font-body text-[18px] portfolio-photo-count max-w-2xl mx-auto">${meta}</p>
</header>`
  }

  if (theme === 'classic') {
    return `
<header class="text-center mb-[48px]">
<span class="text-[13px] uppercase tracking-[0.2em] mb-[16px] block text-primary">Portfolio</span>
<h1 class="font-headline-md text-headline-md text-on-surface mb-[16px]">${title}</h1>
<div class="w-12 h-px mx-auto mb-[24px] bg-primary"></div>
<p class="font-body-md text-body-md portfolio-photo-count italic">${meta}</p>
</header>`
  }

  if (theme === 'dark') {
    return `
<header class="text-center mb-[48px]">
<span class="text-primary font-label-sm tracking-[0.2em] block mb-[16px] uppercase">Portfolio</span>
<h1 class="font-headline-md text-headline-md text-on-surface mb-[16px]">${title}</h1>
<p class="font-body-md text-body-md portfolio-photo-count">${meta}</p>
</header>`
  }

  return `
<header class="text-center mb-[32px] py-[24px]">
<h1 class="font-headline text-[48px] md:text-[64px] font-bold text-on-surface leading-tight mb-[8px]">${title}</h1>
<p class="font-body text-[16px] portfolio-photo-count">${meta}</p>
</header>`
}

export function generatePublicPortfolioPageHTML(options: {
  theme: PhotographerSiteTheme
  studioName: string
  logoUrl: string | null
  homepagePath: string
  portfolioPath: string
  portfolio: PublicPortfolioPageData
  hasFaq?: boolean
  hasPackages?: boolean
  hasBlog?: boolean
  blogPath?: string
  shouldColorLogo?: boolean
}) {
  const chromeTheme = toChromeTheme(options.theme)
  const primaryColor = options.portfolio.accentColor

  const chrome = createSiteChromeConfig({
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
    galleryLayoutMode: 'portfolio',
    portfolioPath: options.portfolioPath,
  })

  const masonryEmptyMessage =
    options.portfolio.photos.length === 0
      ? '<p class="text-center text-on-surface-variant py-16">אין תמונות להצגה</p>'
      : ''

  const body = `
<main class="pt-24">
<section class="max-w-[1280px] mx-auto px-[24px] pt-8 pb-24">
${portfolioHeader(chromeTheme, options.portfolio.pageTitle, options.portfolio.photos.length)}
<nav class="portfolio-tabs" aria-label="גלריות">
${generateTabButtons(options.portfolio.galleryNames, chromeTheme)}
</nav>
<section class="pg-masonry mb-[80px]" id="portfolio-masonry">
${masonryEmptyMessage}
<div id="portfolio-load-sentinel" aria-hidden="true"></div>
</section>
<p id="portfolio-load-status" class="portfolio-load-status" aria-live="polite"></p>
</section>
</main>
${generatePortfolioPhotosDataScript(options.portfolio.photos)}`

  return `<!DOCTYPE html>
<html dir="rtl" lang="he" style="scroll-behavior: smooth;">
${generatePublicGalleryThemeHead(chromeTheme, options.studioName, primaryColor, options.portfolio.pageTitle, options.shouldColorLogo ?? false)}
${PUBLIC_GALLERY_MASONRY_STYLES}
${generatePortfolioTabStyles(primaryColor)}
${generateSiteNav(chrome)}
${body}
${PUBLIC_GALLERY_LIGHTBOX_MARKUP}
${generateSiteFooter(chrome)}
<script>${generateSiteNavScrollScript(chromeTheme, 'href')}</script>
<script>${generatePortfolioLazyLoadScript(options.portfolio.pageTitle, chromeTheme)}</script>
<script>${PUBLIC_GALLERY_LIGHTBOX_DELEGATION_SCRIPT}</script>
</body>
</html>`
}
