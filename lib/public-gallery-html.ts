import {
  createSiteChromeConfig,
  generateSiteFooter,
  generateSiteNav,
  generateSiteNavScrollScript,
  generateSiteNavStyles,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'
import type { PhotographerSiteTheme } from '@/lib/photographer-site-paths'

export type PublicGalleryPhoto = {
  id: string
  url: string | null
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
  column-gap: 12px;
}
@media (min-width: 640px) { .pg-masonry { column-count: 2; } }
@media (min-width: 1024px) { .pg-masonry { column-count: 3; } }
@media (min-width: 1280px) { .pg-masonry { column-count: 4; } }
.pg-masonry-cell {
  break-inside: avoid;
  margin-bottom: 12px;
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
}
.pg-masonry-cell:hover img { transform: scale(1.03); }
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
  classic: { radius: '4px', bg: '#eae8e5', extra: '' },
  modern: { radius: '12px', bg: '#eae8e5', extra: 'box-shadow: 0 1px 3px rgba(0,0,0,0.08);' },
  dark: { radius: '2px', bg: '#1A1A22', extra: '' },
}

function photoGrid(photos: PublicGalleryPhoto[], title: string, theme: SiteChromeTheme) {
  const cfg = MASONRY_CELL_STYLE[theme]
  return photos
    .map((photo, index) => {
      if (!photo.url) return ''
      const alt = escapeHtml(`${title} - ${index + 1}`)
      const delay = (index % 4) * 90
      return `
<div class="pg-masonry-cell group" style="border-radius:${cfg.radius};background:${cfg.bg};overflow:hidden;${cfg.extra}" data-reveal-delay="${delay}">
  <img src="${photo.url}" alt="${alt}" loading="lazy" />
</div>`
    })
    .join('')
}

function ctaSection(data: PublicGalleryPageData, theme: SiteChromeTheme) {
  if (!data.contactCardTitle && !data.contactCardDescription) return ''
  const title = escapeHtml(data.contactCardTitle || 'מוכנים ליצור משהו יוצא דופן?')
  const description = escapeHtml(
    data.contactCardDescription ||
      'אנחנו זמינים לצילום פרויקטים מיוחדים. בואו נתכנן יחד את הסיפור הבא שלכם.'
  )

  if (theme === 'dark') {
    return `
<section class="py-[80px] bg-[#121217] border-t border-white/5">
  <div class="max-w-[1280px] mx-auto px-[24px] text-center">
    <h2 class="font-headline-md text-headline-md text-on-surface mb-[24px]">${title}</h2>
    <p class="font-body-md text-body-md text-on-surface-variant mb-[48px] max-w-xl mx-auto" style="white-space: pre-line">${description}</p>
  </div>
</section>`
  }

  if (theme === 'classic') {
    return `
<section class="py-[80px] bg-[#f6f3f0] border-y border-[#d6c3bb]/20">
  <div class="max-w-[1280px] mx-auto px-[24px] text-center">
    <h2 class="font-headline-md text-headline-md mb-[24px]">${title}</h2>
    <p class="font-body-md text-body-md text-on-surface-variant mb-[48px] max-w-xl mx-auto" style="white-space: pre-line">${description}</p>
  </div>
</section>`
  }

  if (theme === 'modern') {
    return `
<section class="max-w-[1280px] mx-auto px-[24px] mb-[80px]">
  <div class="relative bg-[#2D2825] text-white rounded-xl p-[32px] overflow-hidden shadow-lg">
    <h2 class="font-headline text-[32px] font-bold mb-[12px]">${title}</h2>
    <p class="text-[14px] text-[#e5e2df] mb-[32px] opacity-80" style="white-space: pre-line">${description}</p>
  </div>
</section>`
  }

  return `
<section class="py-[80px] bg-[#f6f3f0] border-y border-[#d6c3bb]/20">
  <div class="max-w-[1280px] mx-auto px-[24px] text-center">
    <h2 class="font-serif-hebrew text-[36px] mb-[24px] font-medium">${title}</h2>
    <p class="font-body text-[16px] text-[#5A504A] mb-[48px] max-w-xl mx-auto" style="white-space: pre-line">${description}</p>
  </div>
</section>`
}

function galleryBody(data: PublicGalleryPageData, theme: SiteChromeTheme) {
  const title = escapeHtml(data.title)
  const meta = `${data.photoCount} תמונות • ${escapeHtml(data.galleryDate)}`

  if (theme === 'elegant') {
    return `
<main class="pt-24">
<section class="max-w-[1280px] mx-auto px-[24px] pt-8 pb-24">
<header class="text-center mb-[80px]">
<span class="text-[13px] uppercase tracking-[0.2em] mb-[16px] block elegant-accent">Aesthetic Collection</span>
<h1 class="font-serif-hebrew text-[48px] md:text-[68px] text-on-surface mb-[16px] font-medium">${title}</h1>
<div class="w-16 h-px mx-auto mb-[24px] elegant-bg-accent"></div>
<p class="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto">${meta}</p>
</header>
<section class="pg-masonry mb-[80px]">
${photoGrid(data.photos, data.title, theme)}
</section>
${ctaSection(data, theme)}
</section>
</main>`
  }

  if (theme === 'classic') {
    return `
<main class="pt-24">
<section class="max-w-[1280px] mx-auto px-[24px] pt-8 pb-24">
<header class="text-center mb-[48px]">
<span class="text-[13px] uppercase tracking-[0.2em] mb-[16px] block text-primary">Editorial Series</span>
<h1 class="font-headline-md text-headline-md text-on-surface mb-[16px]">${title}</h1>
<div class="w-12 h-px mx-auto mb-[24px] bg-primary"></div>
<p class="font-body-md text-body-md text-on-surface-variant italic">${meta}</p>
</header>
<section class="pg-masonry mb-[80px]">
${photoGrid(data.photos, data.title, theme)}
</section>
${ctaSection(data, theme)}
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
<section class="pg-masonry mb-[80px]">
${photoGrid(data.photos, data.title, theme)}
</section>
${ctaSection(data, theme)}
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
<section class="pg-masonry mb-[80px]">
${photoGrid(data.photos, data.title, theme)}
</section>
${ctaSection(data, theme)}
</section>
</main>`
}

function themeHead(theme: SiteChromeTheme, studioName: string, primaryColor: string) {
  const title = escapeHtml(`${studioName} | גלריה`)

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
${generateSiteNavStyles(theme, primaryColor)}
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
${generateSiteNavStyles(theme, primaryColor)}
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
${generateSiteNavStyles(theme, primaryColor)}
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
}) {
  const chromeTheme = toChromeTheme(options.theme)
  const primaryColor = options.gallery.accentColor
  const chrome = createSiteChromeConfig({
    theme: chromeTheme,
    studioName: options.studioName,
    logoUrl: options.logoUrl,
    primaryColor,
    homepagePath: options.homepagePath,
    linkMode: 'href',
  })

  return `<!DOCTYPE html>
<html dir="rtl" lang="he" style="scroll-behavior: smooth;">
${themeHead(chromeTheme, options.studioName, primaryColor)}
${MASONRY_STYLES}
${generateSiteNav(chrome)}
${galleryBody(options.gallery, chromeTheme)}
${generateSiteFooter(chrome)}
<script>${generateSiteNavScrollScript(chromeTheme)}</script>
<script>${masonryRevealScript}</script>
</body>
</html>`
}
