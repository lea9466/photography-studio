'use client'

import { useEffect, useState } from 'react'
import {
  generateHeroSlideshowHTML,
  HERO_SLIDESHOW_CSS,
  HERO_SLIDESHOW_FILM_INIT_SCRIPT,
  HERO_SLIDESHOW_INIT_SCRIPT,
  normalizeHeroUrlList,
} from '@/lib/hero-slideshow'
import {
  createSiteChromeConfig,
  generateSiteFooter,
  generateSiteNav,
  generateSiteNavScrollScript,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'

interface Photographer {
  id: string
  name: string
  studio_name: string
  logo_url: string | null
  about_text: string | null
  about_title: string | null
  about_subtitle: string | null
  about_description: string | null
  contact_card_title: string | null
  contact_card_description: string | null
  stat_projects: number
  stat_clients: number
  stat_experience_years: number
  accent_color: string
  selected_theme: string
  hero_desktop_url: string | null
  hero_mobile_url: string | null
  hero_desktop_urls?: string[] | null
  hero_mobile_urls?: string[] | null
  about_image_url: string | null
  contact_desktop_url: string | null
  contact_mobile_url: string | null
  packages_desktop_url: string | null
  packages_mobile_url: string | null
  email: string | null
}

interface Gallery {
  id: string
  title: string
  slug: string | null
  preview_url: string | null
  created_at: string
  photographer_slug: string
}

interface Package {
  id: string
  name: string
  price_amount: number
  duration_text: string | null
  includes: string[]
  sort_order: number
  is_featured: boolean
}

interface Testimonial {
  id: string
  title: string
  content: string
  shoot_type: string | null
  review_date: string | null
  created_at: string
  is_featured: boolean
  sort_order: number
  image_url: string | null
}

const UNIFIED_GALLERY_GRID_CSS = `
  .homepage-gallery-section {
    width: 100%;
    overflow: hidden;
  }
  .homepage-gallery-header {
    width: 100%;
    max-width: 80rem;
    margin-inline: auto;
    padding-inline: 1rem;
  }
  @media (min-width: 768px) {
    .homepage-gallery-header {
      padding-inline: 2rem;
    }
  }
  .homepage-gallery-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
    padding-inline: 2%;
    background: var(--homepage-gallery-grid-bg, transparent);
  }
  @media (min-width: 768px) {
    .homepage-gallery-grid {
      flex-wrap: nowrap;
      gap: 4px;
    }
  }
  .homepage-gallery-card {
    position: relative;
    display: block;
    flex: 1 1 calc(50% - 1.5px);
    min-width: 0;
    transition: flex 0.5s ease;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    background: #eae8e5;
    text-decoration: none;
    cursor: pointer;
  }
  .homepage-gallery-card:hover,
  .homepage-gallery-card:focus-visible {
    flex: 2.5 1 0;
  }
  @media (min-width: 768px) {
    .homepage-gallery-card {
      flex: 1 1 0;
      aspect-ratio: 4 / 9;
    }
  }
  .homepage-gallery-card-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 1.2s ease-out;
  }
  .homepage-gallery-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, transparent 100%);
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  .homepage-gallery-card-content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1.25rem 1rem;
    color: #fff;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    pointer-events: none;
    text-align: right;
  }
  .homepage-gallery-card-label {
    font-size: 10px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    opacity: 0.85;
  }
  .homepage-gallery-card-title {
    font-size: 1.35rem;
    margin-top: 0.4rem;
    line-height: 1.1;
  }
  @media (min-width: 768px) {
    .homepage-gallery-card-title { font-size: 1.5rem; }
  }
  .homepage-gallery-card-subtitle {
    font-size: 0.8125rem;
    margin-top: 0.35rem;
    opacity: 0.9;
  }
  .homepage-gallery-card-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.85rem;
    font-size: 10px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
  }
  .homepage-gallery-card-arrow {
    transition: transform 0.4s ease;
  }
  .homepage-gallery-card:hover .homepage-gallery-card-overlay,
  .homepage-gallery-card:focus-visible .homepage-gallery-card-overlay { opacity: 1; }
  .homepage-gallery-card:hover .homepage-gallery-card-content,
  .homepage-gallery-card:focus-visible .homepage-gallery-card-content {
    opacity: 1;
    transform: translateY(0);
  }
  .homepage-gallery-card:hover .homepage-gallery-card-image { transform: scale(1.05); }
  .homepage-gallery-card:hover .homepage-gallery-card-arrow { transform: translateX(-4px); }
`

const TESTIMONIAL_THUMB_CARD_CSS = `
  .testimonials-section {
    background: transparent !important;
  }
  .testimonials-section-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2.25rem 2.75rem;
    justify-content: center;
    align-items: stretch;
    padding-top: 1rem;
    padding-bottom: 1.5rem;
    padding-inline: 1.25rem;
    overflow: visible;
  }
  .testimonials-row {
    display: flex;
    flex-wrap: wrap;
    gap: 2.25rem 2.75rem;
    justify-content: center;
    align-items: stretch;
    width: 100%;
  }
  .classic-testimonials-slide .testimonials-row {
    justify-content: center;
  }
  @media (min-width: 768px) {
    .classic-testimonials-carousel .testimonials-row {
      flex-wrap: nowrap;
      gap: 2.5rem;
    }
  }
  .testimonial-thumb-card {
    position: relative;
    background: #ffffff;
    width: fit-content;
    max-width: min(100%, 24rem);
    min-width: 14rem;
    min-height: 8.5rem;
    align-self: stretch;
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    padding: 2.15rem 1.5rem 2.15rem 5.25rem;
    margin-top: 0.85rem;
    box-sizing: border-box;
  }
  .testimonial-thumb-card__quote {
    position: absolute;
    top: 0;
    right: 1.35rem;
    left: auto;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    padding: 0 0.75rem;
    line-height: 1;
    z-index: 3;
    opacity: 0.42;
    font-size: 2.35rem;
    pointer-events: none;
  }
  .testimonial-thumb-card__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 1;
    margin-top: 0.35rem;
    min-height: 0;
  }
  .testimonial-thumb-card__text {
    flex: 1 1 auto;
  }
  .testimonial-thumb-card__footer {
    margin-top: auto;
    flex-shrink: 0;
  }
  .testimonial-thumb-card__thumb {
    position: absolute;
    left: -1.15rem;
    bottom: -0.85rem;
    width: 4.5rem;
    height: 4.5rem;
    overflow: hidden;
    border: 3px solid #ffffff;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
    z-index: 2;
    background: #f3f0ed;
  }
  .testimonial-thumb-card__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .testimonial-thumb-card--classic {
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(45, 40, 37, 0.08);
    border: 1px solid rgba(121, 116, 126, 0.2);
  }
  .testimonial-thumb-card--elegant {
    border: 1px solid rgba(121, 116, 126, 0.35);
  }
  .testimonial-thumb-card--modern {
    border-radius: 1rem;
    border: 1px solid rgba(121, 116, 126, 0.25);
    box-shadow: 0 10px 30px rgba(45, 40, 37, 0.08);
  }
  .testimonial-thumb-card--dark {
    background: #1c1c26;
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
    color: rgba(255, 255, 255, 0.92);
  }
  .testimonial-thumb-card--dark .testimonial-thumb-card__quote {
    background: #1c1c26;
    opacity: 0.88;
    font-size: 2.85rem;
  }
  .testimonial-thumb-card--dark .testimonial-thumb-card__thumb {
    border-color: #1c1c26;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
    background: #12121b;
  }
  .testimonial-thumb-card--dark .text-on-surface,
  .testimonial-thumb-card--dark .text-on-surface-variant {
    color: rgba(255, 255, 255, 0.9);
  }
  .testimonial-thumb-card--dark .text-on-surface-variant {
    opacity: 0.62;
  }
`

const TESTIMONIALS_EQUAL_HEIGHT_SCRIPT = `
(function() {
  function equalizeTestimonialHeights() {
    var section = document.getElementById('testimonials');
    if (!section) return;
    var cards = section.querySelectorAll('.testimonial-thumb-card');
    if (!cards.length) return;
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.minHeight = '';
    }
    var max = 0;
    for (var j = 0; j < cards.length; j++) {
      var h = cards[j].getBoundingClientRect().height;
      if (h > max) max = h;
    }
    max = Math.ceil(max);
    for (var k = 0; k < cards.length; k++) {
      cards[k].style.minHeight = max + 'px';
    }
  }
  var resizeTimer;
  function scheduleEqualize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(equalizeTestimonialHeights, 120);
  }
  window.addEventListener('load', equalizeTestimonialHeights);
  window.addEventListener('resize', scheduleEqualize);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(equalizeTestimonialHeights);
  }
})();
`

function fillGalleriesToFour(galleries: Gallery[]): Gallery[] {
  if (galleries.length === 0) return []
  if (galleries.length >= 4) return galleries.slice(0, 4)
  const filled = [...galleries]
  while (filled.length < 4) {
    const source = galleries[filled.length % galleries.length]
    filled.push({ ...source, id: `${source.id}-fill-${filled.length}` })
  }
  return filled
}

function galleryNavId(id: string) {
  return id.replace(/-fill-\d+$/, '')
}

function generateUnifiedGalleryGridHTML(
  galleries: Gallery[],
  themeVariant: 'elegant' | 'modern' | 'classic' | 'dark'
): string {
  const display = fillGalleriesToFour(galleries)
  if (display.length === 0) return ''

  const radiusByTheme = {
    elegant: '0px',
    modern: '12px',
    classic: '4px',
    dark: '0px',
  }
  const radius = radiusByTheme[themeVariant]
  const imgExtraClass = ''

  return display
    .map((g) => {
      const year = new Date(g.created_at).getFullYear()
      const galleryUrl = `/public-gallery/${galleryNavId(g.id)}`
      const title = String(g.title)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const preview = g.preview_url || ''

      return `
<a href="${galleryUrl}" target="_parent" class="homepage-gallery-card group" style="border-radius: ${radius};">
  <img alt="${title}" class="homepage-gallery-card-image${imgExtraClass}" src="${preview}" loading="lazy" />
  <div class="homepage-gallery-card-overlay"></div>
  <div class="homepage-gallery-card-content" dir="rtl">
    <p class="homepage-gallery-card-label">סדרה</p>
    <h3 class="homepage-gallery-card-title">${title}</h3>
    <p class="homepage-gallery-card-subtitle">${year}</p>
    <span class="homepage-gallery-card-cta"><span class="homepage-gallery-card-arrow">←</span> לצפייה בגלריה</span>
  </div>
</a>`
    })
    .join('')
}

interface PhotographerHomepageProps {
  photographer: Photographer
  galleries?: Gallery[]
  packages?: Package[]
  testimonials?: Testimonial[]
}

export function PhotographerHomepage({ photographer, galleries = [], packages = [], testimonials = [] }: PhotographerHomepageProps) {
  const [mounted, setMounted] = useState(false)
  const [html, setHtml] = useState('')

  useEffect(() => {
    setMounted(true)
    const themeMap: Record<string, string> = {
      'elegant': 'elegant',
      'modern': 'modern',
      'classic': 'classic',
      'bold': 'dark',
      'dark': 'dark',
    }

    const theme = themeMap[photographer.selected_theme] || 'elegant'
    const generatedHtml = generateHomepageHTML(photographer, theme, galleries, packages, testimonials)
    setHtml(generatedHtml)
  }, [photographer, galleries, packages, testimonials])

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (!html) {
    return <div style={{ padding: '20px' }}>No HTML generated</div>
  }

  return (
    <iframe
      srcDoc={html}
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Photographer Homepage"
    />
  )
}

function underlineLastWord(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  const words = trimmed.split(/\s+/)
  if (words.length === 1) {
    return `<span class="about-title-underline">${trimmed}</span>`
  }
  const lastWord = words.pop()!
  return `${words.join(' ')} <span class="about-title-underline">${lastWord}</span>`
}

function brandLastWord(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  const words = trimmed.split(/\s+/)
  if (words.length === 1) {
    return `<span class="text-primary font-light">${trimmed}</span>`
  }
  const lastWord = words.pop()!
  return `${words.join(' ')} <span class="text-primary font-light">${lastWord}</span>`
}

function contactFormSubmitScript(photographerId: string): string {
  return `
    (function() {
      var form = document.querySelector('#contact form');
      if (!form) return;
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalLabel = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'שולח...';
        }
        var fd = new FormData(form);
        var payload = {
          photographerId: '${photographerId}',
          name: String(fd.get('name') || ''),
          email: String(fd.get('email') || ''),
          phone: String(fd.get('phone') || '') || undefined,
          subject: String(fd.get('subject') || '') || undefined,
          message: String(fd.get('message') || ''),
        };
        fetch('/api/contact-inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        .then(function(res) {
          return res.json().then(function(data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function(result) {
          if (!result.ok) throw new Error(result.data.error || 'שגיאה בשליחה');
          var section = document.querySelector('#contact .contact-section-content') || document.querySelector('#contact');
          if (section) {
            section.innerHTML = '<div class="text-center py-16"><p class="text-xl font-medium mb-2">הפנייה נשלחה בהצלחה ✓</p><p class="opacity-70">ניצור איתך קשר בהקדם.</p></div>';
          }
        })
        .catch(function(err) {
          alert(err.message || 'שגיאה בשליחה');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalLabel;
          }
        });
      });
    })();
  `
}

function generateHomepageHTML(photographer: Photographer, theme: string, galleries: Gallery[], packages: Package[], testimonials: Testimonial[] = []): string {
  const {
    id: photographerId,
    name,
    studio_name,
    logo_url,
    about_text,
    about_title,
    about_subtitle,
    about_description,
    contact_card_title,
    contact_card_description,
    stat_projects,
    stat_clients,
    stat_experience_years,
    accent_color,
    hero_desktop_url,
    hero_mobile_url,
    hero_desktop_urls,
    hero_mobile_urls,
    about_image_url,
    contact_desktop_url,
    contact_mobile_url,
    packages_desktop_url,
    packages_mobile_url,
    email,
  } = photographer

  const contactDesktopUrl = contact_desktop_url || null
  const contactMobileUrl = contact_mobile_url || null
  const hasContactBg = !!(contactDesktopUrl || contactMobileUrl)
  const packagesDesktopUrl = packages_desktop_url || null
  const packagesMobileUrl = packages_mobile_url || null
  const hasPackagesBg = !!(packagesDesktopUrl || packagesMobileUrl)

  const sectionBgCss = hasContactBg || hasPackagesBg
    ? `
        .contact-section-has-bg { position: relative; overflow: hidden; width: 100%; }
        .contact-section-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            pointer-events: none;
        }
        .contact-section-bg-desktop { display: none; opacity: 0.52; }
        .contact-section-bg-mobile {
            display: block;
            opacity: 0.3;
            filter: brightness(1.42) saturate(0.88);
            -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 48%, transparent 88%);
            mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 48%, transparent 88%);
        }
        @media (min-width: 768px) {
            .contact-section-bg-desktop { display: block; }
            .contact-section-bg-mobile { display: none; }
        }
        .contact-section-bg-overlay {
            position: absolute;
            inset: 0;
            z-index: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        @media (max-width: 767px) {
            .contact-section-bg-overlay {
                background: linear-gradient(to bottom, transparent 0%, var(--contact-fade, #FAFAF8) 86%);
            }
        }
        @media (min-width: 768px) {
            .contact-section-bg-overlay {
                background: linear-gradient(to bottom, color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fff)) 38%, transparent), color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fff)) 80%, transparent));
            }
        }
        .contact-section-content { position: relative; z-index: 1; }
    `
    : ''

  const sectionBgLayers = (
    enabled: boolean,
    desktopUrl: string | null,
    mobileUrl: string | null,
    mobileFade: string,
    desktopFade?: string
  ) => {
    if (!enabled) return ''
    const desktop = desktopUrl || mobileUrl
    const mobile = mobileUrl || desktopUrl
    const desktopFadeColor = desktopFade || mobileFade
    return `
      <div class="contact-section-bg contact-section-bg-desktop" style="background-image:url('${desktop}')"></div>
      <div class="contact-section-bg contact-section-bg-mobile" style="background-image:url('${mobile}')"></div>
      <div class="contact-section-bg-overlay" style="--contact-fade:${mobileFade};--contact-fade-desktop:${desktopFadeColor}"></div>
    `
  }

  const contactBgLayers = (mobileFade: string, desktopFade?: string) =>
    sectionBgLayers(hasContactBg, contactDesktopUrl, contactMobileUrl, mobileFade, desktopFade)

  const packagesBgLayers = (mobileFade: string, desktopFade?: string) =>
    sectionBgLayers(hasPackagesBg, packagesDesktopUrl, packagesMobileUrl, mobileFade, desktopFade)

  const primaryColor = accent_color || '#B8953F'
  const desktopHeroImages = normalizeHeroUrlList(hero_desktop_urls, hero_desktop_url)
  const mobileHeroImages = normalizeHeroUrlList(
    hero_mobile_urls,
    hero_mobile_url,
    desktopHeroImages[0] ?? null
  )
  const heroSlideshowHtml = generateHeroSlideshowHTML({
    desktopImages: desktopHeroImages,
    mobileImages: mobileHeroImages,
    alt: studio_name || 'סטודיו צילום',
  })
  const heroSlideshowModernHtml = generateHeroSlideshowHTML({
    desktopImages: desktopHeroImages,
    mobileImages: mobileHeroImages,
    alt: studio_name || 'סטודיו צילום',
    heroId: 'hero-slideshow-modern',
  })
  const heroSlideshowBoldHtml = generateHeroSlideshowHTML({
    desktopImages: desktopHeroImages,
    mobileImages: mobileHeroImages,
    alt: studio_name || 'סטודיו צילום',
    heroId: 'hero-slideshow-bold',
    transition: 'film',
    imgClass: 'bold-hero-image',
  })
  const aboutImage = about_image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIq8lAwhbuZMrb5ZZ_F-ZyhFBSMxWhWNg7V-_a7q3NWQrpgsg9RqhbgcZcJiXVII6xbNapQk30LDSiiVCpM7XrGqYj1YlL3K_Y8xKZ7tqBxFqQoory1FYngx7ju_3XuDodAO_Nt0V8m8Hm_NtH8GnVKN3O3PGvDPlSuwxt8rFnJjOlVPFSJu7Kv81xtWup4oxTJZJvwL4TwYUps6nqbPhL22XF_WJkDiv0r0jFuN2887-7PiO9KEBAVS1OX75Z3uKuCScZ_TlTFOc'

  const studioName = studio_name || 'סטודיו גלריה'
  const photographerName = name || 'אפרת כהן'
  const siteChrome = (themeKey: SiteChromeTheme) =>
    createSiteChromeConfig({
      theme: themeKey,
      studioName,
      logoUrl: logo_url,
      primaryColor,
      homepagePath: '/',
      linkMode: 'scroll',
    })
  const aboutText = about_text || 'ב-Studio Gallery, אנו מאמינים שכל אישה נושאת בתוכה סיפור ייחודי הראוי להיות מונצח באמנות. הגישה שלנו משלבת צילום אופנה קלאסי עם רגישות דוקומנטרית מודרנית.'
  const aboutTitle = about_title || ''
  const aboutSubtitle = about_subtitle || ''
  const aboutDescription = about_description || ''
  const contactCardTitle = contact_card_title || ''
  const contactCardDescription = contact_card_description || ''

  const statsProjects = stat_projects ?? 0
  const statsClients = stat_clients ?? 0
  const statsYears = stat_experience_years ?? 0
  const hasStats = statsProjects > 0 || statsClients > 0 || statsYears > 0
  const hasPackages = packages.length > 0
  const hasTestimonials = testimonials.length > 0
  const formatStat = (value: number) => (value > 0 ? `${value}+` : `${value}`)

  // Generate dynamic packages HTML for each theme
  const packageCardBg = (solidClass: string) =>
    hasPackagesBg ? `${solidClass}/55 backdrop-blur-sm` : solidClass

  const generatePackagesHTML = (currentTheme: string) => {
    if (packages.length === 0) return ''
    
    return packages.map((pkg, i) => {
      const includesList = pkg.includes || [];
      const isFeatured = pkg.is_featured;
      
      if (currentTheme === 'elegant') {
        return `
        <div class="${isFeatured ? `${packageCardBg('bg-white')} border-2` : `${packageCardBg('bg-white')} border border-outline-variant`} p-10 flex flex-col h-full reveal-on-scroll relative" style="direction: rtl !important; text-align: center !important; ${isFeatured ? `border-color: ${primaryColor};` : ''}">
          ${isFeatured ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-lg" style="direction: rtl !important; background-color: ${primaryColor};">הנמכרת ביותר</div>` : ''}
          <div class="text-center mb-8 ${isFeatured ? 'mt-2' : ''}" style="direction: rtl !important; text-align: center !important;">
            <h3 class="font-display text-3xl mb-2" style="direction: rtl !important; text-align: center !important; color: ${isFeatured ? primaryColor : '#0F0F0D'};">${pkg.name}</h3>
            <div class="text-lg tracking-widest elegant-accent" style="direction: rtl !important; text-align: center !important; color: ${isFeatured ? primaryColor : 'inherit'};">₪${pkg.price_amount}</div>
          </div>
          <div class="border-t pt-8 mb-10 flex-grow" style="direction: rtl !important; text-align: center !important; ${isFeatured ? `border-color: ${primaryColor}20;` : 'border-color: rgba(15, 15, 13, 0.1);'}">
            <div class="mx-auto w-fit" style="direction: rtl !important;">
              <ul class="space-y-4 font-body text-base ${isFeatured ? 'text-on-surface-variant' : 'opacity-80'}" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
                ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-4 w-full"><span class="material-symbols-outlined text-xl" style="color: ${isFeatured ? primaryColor : 'inherit'};">check</span> <span>${item}</span></li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="mt-auto" style="direction: rtl !important; text-align: center !important;">
            <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full border border-[#0F0F0D] px-8 py-4 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all" style="direction: rtl !important; text-align: center !important;">תיאום שיחת ייעוץ</button>
          </div>
        </div>
      `;
      } else if (currentTheme === 'modern') {
        return `
        <div class="${packageCardBg('bg-white')} p-xl rounded-2xl modern-shadow border border-outline-variant flex flex-col gap-md transition-all hover:-translate-y-2 animate-reveal ${isFeatured ? 'border-2 border-primary' : ''}" style="direction: rtl !important; text-align: center !important;">
          ${isFeatured ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-lg py-1 rounded-full text-xs font-bold uppercase tracking-wider" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <div style="direction: rtl !important; text-align: center !important;">
            <h3 class="font-headline text-2xl font-bold" style="direction: rtl !important; text-align: center !important;">${pkg.name}</h3>
            <div class="flex items-baseline gap-xs mt-sm justify-center" style="direction: rtl !important; text-align: center !important;">
              <span class="font-headline text-3xl font-bold text-primary" style="direction: rtl !important;">₪${pkg.price_amount}</span>
            </div>
          </div>
          <div class="mx-auto w-fit flex-grow my-lg" style="direction: rtl !important;">
            <ul class="flex flex-col gap-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-sm text-md"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> <span>${item}</span></li>`).join('')}
            </ul>
          </div>
          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full py-md ${isFeatured ? 'bg-primary text-white rounded-lg font-bold btn-magnetic shadow-lg shadow-indigo-100' : 'border border-primary text-primary rounded-lg font-bold btn-magnetic hover:bg-primary/5'} transition-all" style="direction: rtl !important; text-align: center !important;">
            הזמינו עכשיו
          </button>
        </div>
      `;
      } else if (currentTheme === 'dark') {
        return `
        <div class="${isFeatured ? `${packageCardBg('bg-background')} p-lg md:p-xl flex flex-col items-center text-center relative md:-translate-y-lg shadow-2xl` : `${packageCardBg('bg-background')} p-lg md:p-xl transition-all flex flex-col items-center text-center shadow-sm hover:shadow-xl group border border-white/10`}" style="direction: rtl !important; text-align: center !important;">
          ${isFeatured ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-lg py-xs font-label-sm uppercase tracking-widest" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <span class="font-label-sm text-primary/60 mb-md tracking-widest uppercase" style="direction: rtl !important; text-align: center !important;">${isFeatured ? 'Professional' : 'Essential'}</span>
          <h3 class="font-headline-sm mb-sm text-on-surface" style="direction: rtl !important; text-align: center !important;">${pkg.name}</h3>
          <div class="text-[48px] lg:text-display-lg ${isFeatured ? 'text-primary' : 'text-on-surface'} mb-xl" style="direction: rtl !important; text-align: center !important;">₪${pkg.price_amount}</div>
          <div class="mx-auto w-fit mb-xl" style="direction: rtl !important;">
            <ul class="space-y-md text-on-surface-variant font-body-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-md w-full border-b border-white/10 pb-sm"><span class="material-symbols-outlined text-primary">check_circle</span> <span>${item}</span></li>`).join('')}
            </ul>
          </div>
          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="mt-auto w-full ${isFeatured ? 'bg-primary text-on-primary py-md font-label-sm uppercase tracking-widest hover:opacity-90 btn-fuchsia-transition' : 'border border-on-surface text-on-surface py-md font-label-sm uppercase tracking-widest hover:bg-on-surface hover:text-background btn-fuchsia-transition'}" style="direction: rtl !important; text-align: center !important;">
            ${isFeatured ? 'לבחירת החבילה' : 'הזמן עכשיו'}
          </button>
        </div>
      `;
      } else if (currentTheme === 'classic') {
        return `
        <div class="${packageCardBg('bg-surface')} ${isFeatured ? 'border-2' : 'border border-outline-variant/30 hover:border-primary/50 transition-colors duration-500'} p-xl flex flex-col items-center rounded-sm relative" style="direction: rtl !important; text-align: center !important;${isFeatured ? ` border-color: ${primaryColor};` : ''}">
          ${isFeatured ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-lg py-1 rounded-sm font-label-sm text-label-sm shadow-md uppercase tracking-wider" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <h3 class="font-headline-sm text-headline-sm text-on-surface mb-xs" style="direction: rtl !important; text-align: center !important;">${pkg.name}</h3>
          <p class="font-body-md text-body-md text-on-surface-variant/60 mb-lg" style="direction: rtl !important; text-align: center !important;">${isFeatured ? 'החוויה המלאה' : 'לרגעים קטנים ומרגשים'}</p>
          <div class="text-4xl font-bold text-primary mb-xl flex items-baseline gap-1 justify-center" dir="ltr" style="direction: ltr !important;"><span class="text-lg font-normal">₪</span>${pkg.price_amount}</div>
          <div class="mx-auto w-fit mb-xl border-t ${isFeatured ? 'border-primary/10' : 'border-outline-variant/20'} pt-lg" style="direction: rtl !important;">
            <ul class="space-y-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-md w-full"><span class="material-symbols-outlined text-primary">${isFeatured ? 'check_circle' : 'check'}</span> <span class="font-body-md text-body-md text-on-surface-variant">${item}</span></li>`).join('')}
            </ul>
          </div>
          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full mt-auto ${isFeatured ? 'bg-primary text-on-primary py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all duration-300 shadow-md' : 'border border-primary/40 text-primary py-md rounded-sm font-label-sm text-label-sm hover:bg-primary hover:text-on-primary transition-all duration-300'}" style="direction: rtl !important; text-align: center !important;">
            ${isFeatured ? 'בחירה בחבילה' : 'הזמנת חבילה'}
          </button>
        </div>
      `;
      }
      return '';
    }).join('');
  };

  // Escape user-generated text before injecting into the iframe HTML
  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const formatReviewDate = (t: Testimonial) => {
    const raw = t.review_date || t.created_at
    if (!raw) return ''
    const d = new Date(raw)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
  }

  // Build the "meta" subtitle line (shoot type · date) for a testimonial
  const testimonialMeta = (t: Testimonial) => {
    const shoot = t.shoot_type ? escapeHtml(t.shoot_type) : ''
    const date = formatReviewDate(t)
    return [shoot, date].filter(Boolean).join(' · ')
  }

  // Generate dynamic testimonials HTML for each theme.
  const testimonialThumbSrc = (t: Testimonial) => escapeHtml(t.image_url || logo_url || '')

  const generateTestimonialThumbCard = (
    t: Testimonial,
    variant: 'classic' | 'elegant' | 'modern' | 'dark',
    options?: { delayAttr?: string; extraClass?: string }
  ) => {
    const title = escapeHtml(t.title)
    const content = escapeHtml(t.content)
    const meta = testimonialMeta(t)
    const thumbSrc = testimonialThumbSrc(t)
    const delayAttr = options?.delayAttr ?? ''
    const extraClass = options?.extraClass ?? ''

    const thumbHtml = thumbSrc
      ? `<div class="testimonial-thumb-card__thumb"><img src="${thumbSrc}" alt="" loading="lazy"/></div>`
      : ''

    const quoteHtml = `<span class="testimonial-thumb-card__quote material-symbols-outlined" style="color: ${primaryColor};">format_quote</span>`

    if (variant === 'classic') {
      return `
        <div class="testimonial-thumb-card testimonial-thumb-card--classic classic-testimonial-card italic${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>
          ${quoteHtml}
          ${thumbHtml}
          <div class="testimonial-thumb-card__content">
            ${title ? `<h4 class="font-headline-sm text-headline-sm text-on-surface mb-md not-italic">${title}</h4>` : ''}
            <p class="testimonial-thumb-card__text font-body-lg text-body-lg text-on-surface-variant mb-lg leading-relaxed">${content}</p>
            ${meta ? `<div class="testimonial-thumb-card__footer font-label-sm text-label-sm text-primary font-bold not-italic">${meta}</div>` : ''}
          </div>
        </div>
      `
    }

    if (variant === 'elegant') {
      return `
        <div class="testimonial-thumb-card testimonial-thumb-card--elegant flex flex-col justify-between reveal-on-scroll${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>
          ${quoteHtml}
          ${thumbHtml}
          <div class="testimonial-thumb-card__content">
            <div>
              <div class="flex flex-row-reverse gap-1 text-accent mb-6">
                <span class="material-symbols-outlined fill-1">star</span>
                <span class="material-symbols-outlined fill-1">star</span>
                <span class="material-symbols-outlined fill-1">star</span>
                <span class="material-symbols-outlined fill-1">star</span>
                <span class="material-symbols-outlined fill-1">star</span>
              </div>
              <p class="testimonial-thumb-card__text font-body text-lg italic opacity-80 leading-relaxed mb-8">${content}</p>
            </div>
            <div class="testimonial-thumb-card__footer">
              <h4 class="font-display text-xl mb-1">${title}</h4>
              ${meta ? `<p class="text-xs uppercase tracking-widest opacity-40">${meta}</p>` : ''}
            </div>
          </div>
        </div>
      `
    }

    if (variant === 'modern') {
      return `
        <div class="testimonial-thumb-card testimonial-thumb-card--modern italic text-lg animate-reveal hover-scale modern-shadow${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>
          ${quoteHtml}
          ${thumbHtml}
          <div class="testimonial-thumb-card__content">
            <p class="testimonial-thumb-card__text">${content}</p>
            <div class="testimonial-thumb-card__footer not-italic">
              <div class="mt-md font-bold text-on-surface">${title}</div>
              ${meta ? `<div class="text-on-surface-variant text-sm mt-1">${meta}</div>` : ''}
            </div>
          </div>
        </div>
      `
    }

    return `
        <div class="testimonial-thumb-card testimonial-thumb-card--dark relative${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>
          ${quoteHtml}
          ${thumbHtml}
          <div class="testimonial-thumb-card__content">
            <p class="testimonial-thumb-card__text font-body-md text-on-surface-variant mb-xl relative z-10 italic">${content}</p>
            <div class="testimonial-thumb-card__footer relative z-10">
              <div class="font-label-sm uppercase tracking-widest text-on-surface">${title}</div>
              ${meta ? `<div class="text-[10px] text-on-surface-variant">${meta}</div>` : ''}
            </div>
          </div>
        </div>
      `
  }

  const generateTestimonialsHTML = (currentTheme: string) => {
    if (testimonials.length === 0) return ''

    return testimonials.map((t, i) => {
      if (currentTheme === 'elegant') {
        const delay = i > 0 ? ` style="transition-delay: ${i * 150}ms;"` : ''
        return generateTestimonialThumbCard(t, 'elegant', { delayAttr: delay })
      } else if (currentTheme === 'classic') {
        return ''
      } else if (currentTheme === 'modern') {
        const delayClass = i > 0 ? ` delay-${Math.min(i * 100, 300)}` : ''
        return generateTestimonialThumbCard(t, 'modern', { extraClass: delayClass })
      } else if (currentTheme === 'dark') {
        return generateTestimonialThumbCard(t, 'dark')
      }
      return '';
    }).join('');
  };

  function generateClassicTestimonialCard(t: Testimonial) {
    return generateTestimonialThumbCard(t, 'classic')
  }

  function generateClassicTestimonialsSection() {
    if (testimonials.length === 0) return ''

    const cardsHtml = testimonials.map((t) => generateClassicTestimonialCard(t)).join('')

    if (testimonials.length <= 3) {
      return `
    <div class="testimonials-row">
      ${cardsHtml}
    </div>`
    }

    const slides: Testimonial[][] = []
    for (let i = 0; i < testimonials.length; i += 3) {
      slides.push(testimonials.slice(i, i + 3))
    }

    const slidesHtml = slides
      .map(
        (slide) => `
    <div class="classic-testimonials-slide">
      <div class="testimonials-row">
        ${slide.map((t) => generateClassicTestimonialCard(t)).join('')}
      </div>
    </div>`
      )
      .join('')

    const dotsHtml = `
    <div class="classic-testimonials-dots">
      ${slides
        .map(
          (_, i) =>
            `<button type="button" class="classic-testimonials-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="עמוד תגובות ${i + 1}"></button>`
        )
        .join('')}
    </div>`

    return `
    <div class="classic-testimonials-carousel" id="classic-testimonials-carousel">
      <div class="classic-testimonials-track">${slidesHtml}</div>
      ${dotsHtml}
    </div>`
  }

  // ELEGANT THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const ElegantTheme = () => `
<!DOCTYPE html>
<html class="scroll-smooth" dir="rtl" lang="he" style="scroll-behavior: smooth;">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "primary": "${primaryColor}",
                    "secondary": "#675c57",
                    "tertiary": "#81533f",
                    "background": "#FAFAF8",
                    "surface": "#fdf8f7",
                    "accent": "${primaryColor}",
                    "on-surface": "#1c1b1b",
                    "on-surface-variant": "#464742",
                    "outline": "#767871",
                    "outline-variant": "#c7c7c0",
                    "surface-container-low": "#f7f3f2",
                    "surface-container-high": "#ebe7e6",
                    "surface-container-highest": "#e5e2e1"
            },
            "borderRadius": {
                    "DEFAULT": "0px",
                    "lg": "0px",
                    "xl": "0px"
            },
            "spacing": {
                    "lg": "24px",
                    "margin-mobile": "16px",
                    "md": "16px",
                    "gutter": "24px",
                    "margin-desktop": "64px",
                    "xl": "32px"
            },
            "fontFamily": {
                    "display": ["Playfair Display", "serif"],
                    "body": ["Heebo", "sans-serif"],
                    "serif-hebrew": ["Frank Ruhl Libre", "serif"]
            }
          },
        },
      }
    </script>
<style>
        body {
            background-color: #FAFAF8;
            color: #0F0F0D;
            font-family: 'Heebo', sans-serif;
            overflow-x: hidden;
        }
        
        .elegant-accent { color: ${primaryColor}; }
        .elegant-bg-accent { background-color: ${primaryColor}; }
        .elegant-border-accent { border-color: ${primaryColor}; }
        
        .glass-hero-wrapper {
            position: relative;
        }
        .glass-hero {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 11px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
            animation: gentleFloat 6s ease-in-out infinite;
        }
        @keyframes gentleFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-3px) rotate(0.5deg); }
            50% { transform: translateY(0) rotate(0deg); }
            75% { transform: translateY(3px) rotate(-0.5deg); }
        }
        .gallery-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .hairline-border {
            border: 1px solid rgba(15, 15, 13, 0.1);
        }

        .reveal-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal-on-scroll.active {
            opacity: 1;
            transform: translateY(0);
        }

        .image-reveal {
            overflow: hidden;
            position: relative;
        }
        .image-reveal img {
            transition: transform 1.8s cubic-bezier(0.2, 0, 0.2, 1);
            transform: scale(1.15);
        }
        .image-reveal.active img {
            transform: scale(1);
        }

        .material-symbols-outlined {
            font-variation-settings: 'wght' 200, 'opsz' 24;
        }

        @media (max-width: 1024px) {
            .tablet-stack {
                grid-template-columns: 1fr !important;
            }
        }
        ${UNIFIED_GALLERY_GRID_CSS}
        ${TESTIMONIAL_THUMB_CARD_CSS}
        ${HERO_SLIDESHOW_CSS}
        ${sectionBgCss}
    </style>
</head>
<body class="selection:bg-[${primaryColor}] selection:text-white">
${generateSiteNav(siteChrome('elegant'))}
<main>
<section class="relative h-screen overflow-hidden reveal-on-scroll">
<div class="absolute inset-0 z-0 image-reveal active">
${heroSlideshowHtml}
</div>
<div class="relative z-[100] glass-hero-wrapper absolute top-[55%] -translate-y-1/2 left-4 md:left-4 md:top-[55%] top-[75%]">
<div class="glass-hero p-xl md:p-24 max-w-md text-center backdrop-blur-md">
<h1 class="font-display text-4xl md:text-7xl mb-6 leading-[1.1] text-on-surface">
                אמנות הרגע <br/>
<span class="elegant-accent italic font-light">באוצרות אישית</span>
</h1>
<p class="font-body text-lg md:text-xl text-on-surface/70 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                ${aboutText}
            </p>
<div class="flex justify-center">
<button class="bg-[#0F0F0D] text-white px-12 py-4 text-xs uppercase tracking-[0.3em] hover:bg-accent transition-all duration-300">
                    צפי בגלריה
                </button>
</div>
</div>
</div>
</section>
${hasStats ? `
<section class="px-margin-mobile md:px-margin-desktop py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl reveal-on-scroll">
<div class="text-center">
<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsYears)}</span>
<span class="text-xs uppercase tracking-widest opacity-60">שנות ניסיון</span>
</div>
<div class="text-center">
<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsClients)}</span>
<span class="text-xs uppercase tracking-widest opacity-60">לקוחות מרוצים</span>
</div>
<div class="text-center">
<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsProjects)}</span>
<span class="text-xs uppercase tracking-widest opacity-60">תיקי עבודות</span>
</div>
</section>
` : ''}
${aboutTitle || aboutSubtitle || aboutDescription ? `
<section class="px-margin-mobile md:px-margin-desktop py-32 max-w-7xl mx-auto reveal-on-scroll relative" id="about">
<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70"></div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
<div class="order-2 lg:order-1">
<span class="elegant-accent font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">About · קצת עליי</span>
${aboutTitle ? `<h2 class="font-serif-hebrew text-4xl md:text-5xl mb-8 font-medium">${aboutTitle}</h2>` : ''}
${aboutSubtitle ? `<p class="font-body text-lg mb-6 leading-relaxed opacity-80" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}
${aboutDescription ? `<p class="font-body text-base mb-10 opacity-60 leading-relaxed" style="white-space: pre-line">${aboutDescription}</p>` : ''}
<button class="border border-[#0F0F0D] px-10 py-3 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all duration-300">
                    הכירי את הצוות
                </button>
</div>
<div class="order-1 lg:order-2 image-reveal aspect-[4/5] shadow-2xl">
<img alt="צילום פורטרט" class="w-full h-full object-cover" src="${aboutImage}"/>
</div>
</div>
</section>
` : ''}
<section class="homepage-gallery-section py-24 bg-white" id="gallery">
<div class="homepage-gallery-header px-margin-mobile md:px-margin-desktop mb-16">
<div class="flex flex-row-reverse justify-between items-end reveal-on-scroll">
<h2 class="font-serif-hebrew text-4xl md:text-5xl font-medium">קולקציות נבחרות</h2>
</div>
</div>
<div class="homepage-gallery-grid reveal-on-scroll">
${generateUnifiedGalleryGridHTML(galleries, 'elegant')}
</div>
</section>
${hasPackages ? `
<section class="py-32 px-margin-mobile md:px-margin-desktop ${hasPackagesBg ? 'contact-section-has-bg' : 'bg-[#f2f1ef]'}" id="pricing">
${packagesBgLayers('#f2f1ef', '#f2f1ef')}
<div class="mx-auto max-w-7xl contact-section-content">
<div class="text-center mb-16 reveal-on-scroll">
<h2 class="font-serif-hebrew text-4xl md:text-5xl font-medium mb-4">חבילות שירות</h2>
<p class="font-body opacity-60 italic">השקעה בזיכרונות שיישארו לנצח</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">${generatePackagesHTML('elegant')}</div>
</div>
</section>
` : ''}
${hasTestimonials ? `
<section class="testimonials-section py-32 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto" id="testimonials">
<div class="text-center mb-16 reveal-on-scroll">
<h2 class="font-serif-hebrew text-4xl md:text-5xl font-medium mb-4">מה לקוחות אומרות</h2>
</div>
<div class="testimonials-section-grid">${generateTestimonialsHTML('elegant')}</div>
</section>
` : ''}
<section id="contact" class="pt-32 pb-12 px-margin-mobile md:px-margin-desktop ${hasContactBg ? 'contact-section-has-bg' : 'bg-[#1c1b1b]'} text-white reveal-on-scroll">
${contactBgLayers('#FAFAF8', '#1c1b1b')}
<div class="max-w-4xl mx-auto contact-section-content">
<div class="text-center mb-16">
<h2 class="font-serif-hebrew text-4xl md:text-5xl mb-4">צרי קשר</h2>
<p class="opacity-60 font-light">נשמח לשמוע ממך ולתאם את חווית הצילום המושלמת עבורך.</p>
</div>
${email ? `
<form class="grid grid-cols-1 md:grid-cols-2 gap-10">
<div class="space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">שם מלא</label>
<input name="name" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="השם שלך" type="text"/>
</div>
<div class="space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">אימייל</label>
<input name="email" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="your@email.com" type="email"/>
</div>
<div class="space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">טלפון</label>
<input name="phone" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="050-0000000" type="tel"/>
</div>
<div class="space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">נושא הפנייה</label>
<select name="subject" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white/60">
<option class="bg-[#1c1b1b]">צילומי פורטרט</option>
<option class="bg-[#1c1b1b]">צילומי חתונה</option>
<option class="bg-[#1c1b1b]">צילומי קמפיין</option>
<option class="bg-[#1c1b1b]">אחר</option>
</select>
</div>
<div class="md:col-span-2 space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">הודעה</label>
<textarea name="message" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white min-h-[120px] resize-none" placeholder="איך נוכל לעזור?"></textarea>
</div>
<div class="md:col-span-2 flex justify-center mt-6">
<button type="submit" class="elegant-bg-accent text-white px-16 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300">
                        שליחת הודעה
                    </button>
</div>
</form>
` : '<div class="text-center py-20 opacity-40"><p class="font-body text-lg">אין כתובת אימייל ליצירת קשר</p></div>'}
</div>
</section>
</main>
${generateSiteFooter(siteChrome('elegant'))}
<script>
    const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                const imgReveal = entry.target.querySelector('.image-reveal');
                if (imgReveal) imgReveal.classList.add('active');
            }
        });
    }, observerOptions);
    document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));
    ${generateSiteNavScrollScript('elegant')}
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
</script>
<script>${HERO_SLIDESHOW_INIT_SCRIPT}</script>
<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>
<script>${contactFormSubmitScript(photographerId)}</script>
</body>
</html>
  `;

  // MODERN THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const ModernTheme = () => `
<!DOCTYPE html>
<html class="light" dir="rtl" lang="he" style="scroll-behavior: smooth;">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${studioName} | סטודיו לצילום מודרני</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
        :root {
            --headline-font: 'Space Grotesk', 'Heebo', sans-serif;
        }
        body {
            font-family: 'Heebo', sans-serif;
            background-color: #F8FAFC;
            color: #0F172A;
            scroll-behavior: smooth;
        }
        .font-headline {
            font-family: var(--headline-font);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .modern-shadow {
            box-shadow: 0px 4px 20px rgba(15, 23, 42, 0.05);
        }
        
        @keyframes revealUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal {
            animation: revealUp 0.6s cubic-bezier(0.2, 0, 0.2, 1) forwards;
            opacity: 0;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }

        .hover-scale {
            transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hover-scale:hover {
            transform: scale(1.02);
        }
        
        .btn-magnetic {
            transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .btn-magnetic:active {
            transform: scale(0.96);
        }

        .nav-glass {
            background: rgba(248, 250, 252, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .modern-nav .modern-nav-brand,
        .modern-nav .modern-nav-link,
        .modern-nav .modern-nav-menu-btn {
            color: #ffffff;
            transition: color 0.7s ease;
        }
        .modern-nav:not(.nav-scrolled) {
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            box-shadow: none !important;
        }
        .modern-nav .modern-nav-link:hover,
        .modern-nav .modern-nav-menu-btn:hover {
            color: rgba(255, 255, 255, 0.75);
        }
        .modern-nav .modern-nav-logo {
            transition: filter 0.7s ease;
        }
        .modern-nav:not(.nav-scrolled) .modern-nav-logo {
            filter: brightness(0) invert(1);
        }
        .modern-nav.nav-scrolled .modern-nav-brand {
            color: #0F172A;
        }
        .modern-nav.nav-scrolled .modern-nav-link {
            color: #475569;
        }
        .modern-nav.nav-scrolled .modern-nav-link:hover,
        .modern-nav.nav-scrolled .modern-nav-menu-btn:hover {
            color: ${primaryColor};
        }
        .modern-nav.nav-scrolled .modern-nav-menu-btn {
            color: #0F172A;
        }
        .modern-nav.nav-scrolled .modern-nav-logo {
            filter: none;
        }
        .modern-about-overlay {
            background: linear-gradient(
                to left,
                rgba(15, 23, 42, 0.55) 0%,
                rgba(15, 23, 42, 0.22) 30%,
                transparent 55%
            );
            pointer-events: none;
        }
        .modern-about-content {
            color: #ffffff;
            text-align: right;
            position: relative;
        }
        .modern-about-content::before {
            content: '';
            position: absolute;
            inset: -1.5rem -1.5rem -1.5rem -3rem;
            background: linear-gradient(
                to left,
                rgba(15, 23, 42, 0.82) 0%,
                rgba(15, 23, 42, 0.45) 55%,
                transparent 100%
            );
            border-radius: 1rem;
            z-index: -1;
            pointer-events: none;
        }
        .modern-about-content h1,
        .modern-about-content p,
        .modern-about-content .modern-about-actions {
            width: 100%;
            max-width: 36rem;
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 1rem;
        }
        .modern-about-content .modern-about-muted {
            color: rgba(255, 255, 255, 0.82);
        }
        ${UNIFIED_GALLERY_GRID_CSS}
        ${TESTIMONIAL_THUMB_CARD_CSS}
        ${HERO_SLIDESHOW_CSS}
        ${sectionBgCss}
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "${primaryColor}",
                        background: "#F8FAFC",
                        "on-surface": "#0F172A",
                        "on-surface-variant": "#475569",
                        outline: "#94a3b8",
                        "outline-variant": "#cbd5e1",
                        surface: "#ffffff",
                        "surface-dim": "#f1f5f9",
                        "surface-container": "#f1f5f9",
                        "surface-variant": "#e2e8f0",
                    },
                    borderRadius: {
                        "DEFAULT": "12px",
                        "lg": "12px",
                        "xl": "16px",
                        "2xl": "24px",
                        "full": "9999px"
                    },
                    spacing: {
                        "xl": "48px",
                        "md": "16px",
                        "xxl": "80px",
                        "lg": "24px"
                    }
                },
            },
        }
    </script>
</head>
<body class="bg-background text-on-surface overflow-x-hidden">
${generateSiteNav(siteChrome('modern'))}
<main${aboutTitle || aboutSubtitle || aboutDescription ? '' : ' class="pt-xxl"'}>
${aboutTitle || aboutSubtitle || aboutDescription ? `
<section class="relative min-h-screen w-full overflow-hidden" id="about">
<div class="absolute inset-0 z-0">
${heroSlideshowModernHtml}
<div class="modern-about-overlay absolute inset-0"></div>
</div>
<div class="relative z-10 min-h-screen flex items-center pt-[80px]">
<div class="w-full max-w-7xl mx-auto px-lg py-xxl grid grid-cols-1 md:grid-cols-2 gap-xl items-center min-h-[calc(100vh-80px)]">
<div class="flex flex-col gap-md animate-reveal relative z-10 modern-about-content justify-self-start">
<span class="text-primary font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">About · קצת עליי</span>
${aboutTitle ? '<h1 class="font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-white">' + aboutTitle + '</h1>' : '<h1 class="font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-white">אמנות הרגע <br/><span class="text-primary">בצורה מודרנית</span></h1>'}
${aboutSubtitle ? '<p class="text-lg md:text-xl modern-about-muted leading-relaxed" style="white-space: pre-line">' + aboutSubtitle + '</p>' : ''}
${aboutDescription ? '<p class="text-lg md:text-xl modern-about-muted leading-relaxed" style="white-space: pre-line">' + aboutDescription + '</p>' : ''}
<div class="modern-about-actions pt-md">
<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="bg-primary text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:shadow-xl shadow-indigo-200 transition-all">
                    התחילו עכשיו
                </button>
<button onclick="document.querySelector('#portfolio').scrollIntoView({behavior: 'smooth'})" class="border border-white/40 text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:bg-white/10 transition-all">
                    לצפייה בגלריה
                </button>
</div>
</div>
<div class="hidden md:block" aria-hidden="true"></div>
</div>
</div>
</section>
` : ''}
${hasStats ? `
<section class="max-w-7xl mx-auto px-lg py-xxl">
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal hover-scale">
<span class="material-symbols-outlined text-primary text-5xl">photo_camera</span>
<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsProjects)}</h3>
<p class="text-on-surface-variant font-medium">תיקי עבודות</p>
</div>
<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-100 hover-scale">
<span class="material-symbols-outlined text-primary text-5xl">groups</span>
<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsClients)}</h3>
<p class="text-on-surface-variant font-medium">לקוחות מרוצים</p>
</div>
<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-200 hover-scale">
<span class="material-symbols-outlined text-primary text-5xl">military_tech</span>
<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsYears)}</h3>
<p class="text-on-surface-variant font-medium">שנות ניסיון</p>
</div>
</div>
</section>
` : ''}
<section class="homepage-gallery-section py-xxl" id="portfolio">
<div class="homepage-gallery-header px-lg mb-xl">
<div class="flex flex-row-reverse justify-between items-end gap-md animate-reveal">
<div class="text-right">
<h2 class="font-headline text-4xl font-bold mb-xs">העבודות האחרונות שלנו</h2>
<p class="text-on-surface-variant">מבט קצר אל הרגעים שתפסנו לאחרונה</p>
</div>
</div>
</div>
<div class="homepage-gallery-grid animate-reveal">
${generateUnifiedGalleryGridHTML(galleries, 'modern')}
</div>
</section>
${hasPackages ? (hasPackagesBg ? `
<section class="max-w-7xl mx-auto px-lg contact-section-has-bg rounded-2xl py-xxl" id="pricing">
${packagesBgLayers('#F8FAFC')}
<div class="contact-section-content">
<div class="text-center mb-xl animate-reveal">
<h2 class="font-headline text-4xl font-bold text-on-surface">חבילות הצילום שלנו</h2>
<p class="text-on-surface-variant">בחרו את החבילה המתאימה ליותר עבורכם</p>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-xl">${generatePackagesHTML('modern')}</div>
</div>
</section>
` : `
<section class="py-xxl bg-surface-dim" id="pricing">
<div class="max-w-7xl mx-auto px-lg">
<div class="text-center mb-xl animate-reveal">
<h2 class="font-headline text-4xl font-bold text-on-surface">חבילות הצילום שלנו</h2>
<p class="text-on-surface-variant">בחרו את החבילה המתאימה ליותר עבורכם</p>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-xl">${generatePackagesHTML('modern')}</div>
</div>
</section>
`) : ''}
${hasTestimonials ? `
<section class="testimonials-section py-xxl max-w-7xl mx-auto px-lg" id="testimonials">
<h2 class="font-headline text-4xl font-bold text-center mb-xl animate-reveal">מה הלקוחות אומרים</h2>
<div class="testimonials-section-grid">${generateTestimonialsHTML('modern')}</div>
</section>
` : ''}
<section class="max-w-7xl mx-auto px-lg ${hasContactBg ? 'contact-section-has-bg rounded-2xl' : ''}" id="contact">
${contactBgLayers('#F8FAFC')}
<div class="contact-section-content">
<div class="${hasContactBg ? 'bg-primary/88 backdrop-blur-sm' : 'bg-primary'} rounded-2xl p-xl md:p-xxl text-white animate-reveal">
<div class="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
<div class="max-w-md text-right">
<h2 class="font-headline text-4xl font-bold mb-sm text-white">צרו איתנו קשר</h2>
<p class="text-lg opacity-90 text-white mb-lg">השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או סשן צילומים.</p>
<div class="flex flex-col gap-md">
<div class="flex items-center justify-start gap-sm">
<span class="material-symbols-outlined text-white">call</span>
<span class="text-white" dir="ltr">050-1234567</span>
</div>
<div class="flex items-center justify-start gap-sm">
<span class="material-symbols-outlined text-white">mail</span>
<span class="text-white">${email || 'hello@studiogallery.co.il'}</span>
</div>
<div class="flex items-center justify-start gap-sm">
<span class="material-symbols-outlined text-white">location_on</span>
<span class="text-white">תל אביב, ישראל</span>
</div>
</div>
</div>
<form class="flex flex-col gap-md w-full">
<div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
<div class="relative">
<input name="name" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_name" placeholder="שם מלא" type="text"/>
</div>
<div class="relative">
<input name="email" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_email" placeholder="אימייל" type="email"/>
</div>
</div>
<div class="relative">
<input name="phone" class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_phone" placeholder="טלפון" type="tel"/>
</div>
<div class="relative">
<textarea name="message" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_message" placeholder="הודעה" rows="3"></textarea>
</div>
<button class="bg-white text-primary px-xl py-md rounded-lg font-bold btn-magnetic hover:shadow-xl w-full transition-all" type="submit">
                        שליחת הודעה
                    </button>
</form>
</div>
</div>
</div>
</section>
</main>
${generateSiteFooter(siteChrome('modern'))}
<script>${generateSiteNavScrollScript('modern')}</script>
<script>${HERO_SLIDESHOW_INIT_SCRIPT}</script>
<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>
<script>${contactFormSubmitScript(photographerId)}</script>
</body>
</html>
  `;

  // CLASSIC THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const ClassicTheme = () => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${studioName} | צילום מקצועי</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@400;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<style>
        :root {
            --headline-font: 'Frank Ruhl Libre', serif;
        }
        body {
            font-family: 'Heebo', sans-serif;
            scroll-behavior: smooth;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .classic-overlay {
            background: linear-gradient(to top, rgba(181, 129, 106, 0.6) 0%, rgba(181, 129, 106, 0) 100%);
        }
        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal.active {
            opacity: 1;
            transform: translateY(0);
        }
        .stagger-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .reveal.active .stagger-item {
            opacity: 1;
            transform: translateY(0);
        }
        .stagger-item:nth-child(1) { transition-delay: 0.1s; }
        .stagger-item:nth-child(2) { transition-delay: 0.2s; }
        .stagger-item:nth-child(3) { transition-delay: 0.3s; }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
        }
        @keyframes verticalLabelFloat {
            0%, 100% {
                transform: rotate(180deg) translateY(0);
                opacity: 0.78;
            }
            50% {
                transform: rotate(180deg) translateY(-16px);
                opacity: 0.95;
            }
        }
        .glass-card-float {
            animation: float 5s ease-in-out infinite;
        }
        .vertical-text-label {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-size: 1.2rem;
            font-weight: 500;
            letter-spacing: 0.38em;
            color: rgba(255, 255, 255, 0.78);
            text-shadow:
                0 2px 18px rgba(0, 0, 0, 0.42),
                0 0 28px rgba(255, 255, 255, 0.14),
                0 1px 2px rgba(0, 0, 0, 0.25);
            animation: verticalLabelFloat 5.5s ease-in-out infinite;
        }
        .glass-card-frame {
            position: relative;
            display: inline-block;
        }
        .glass-card-accent-line {
            position: absolute;
            bottom: -18px;
            right: 40px;
            width: 56px;
            height: 2px;
            background: ${primaryColor};
            pointer-events: none;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.75);
            border-radius: 0;
            box-shadow: none;
        }
        .hero-glass-container {
            position: absolute;
            z-index: 10;
            bottom: 0;
            left: 0;
            right: 0;
            transform: none;
            width: 100%;
            max-width: none;
            padding: 0 1rem 1rem;
        }
        @media (min-width: 768px) and (max-width: 1023px) {
            .hero-glass-container {
                padding: 0 1.25rem 1.25rem;
            }
            .hero-glass-inner {
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 1.25rem;
            }
            .hero-glass-copy {
                text-align: center;
                flex: none;
                width: 100%;
            }
            .hero-glass-copy h1 {
                font-size: clamp(1.75rem, 3.5vw, 2.25rem);
                margin-bottom: 0.75rem;
            }
            .hero-glass-copy p {
                font-size: 1rem;
                margin-bottom: 0;
                max-width: 36rem;
                margin-left: auto;
                margin-right: auto;
            }
            .hero-glass-actions {
                flex-direction: row;
                flex-shrink: 0;
                align-self: center;
                justify-content: center;
                width: auto;
                max-width: 100%;
            }
            .hero-glass-card {
                width: 100%;
                padding: 1.75rem 2rem;
            }
        }
        @media (min-width: 1024px) {
            .hero-glass-container {
                position: relative;
                bottom: auto;
                left: auto;
                transform: none;
                width: auto;
                max-width: none;
                padding: 0 0 4rem 8rem;
            }
            .hero-glass-inner {
                flex-direction: column;
                align-items: stretch;
            }
            .hero-glass-copy {
                text-align: right;
            }
            .hero-glass-actions {
                flex-direction: row;
            }
            .hero-glass-copy p {
                margin-bottom: 2rem;
            }
        }
        .hero-glass-card {
            width: 100%;
        }
        .hero-glass-inner {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }
        .hero-glass-copy {
            text-align: center;
        }
        .hero-glass-actions {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.75rem;
            width: 100%;
        }
        @media (min-width: 640px) and (max-width: 767px) {
            .hero-glass-actions {
                flex-direction: row;
                justify-content: center;
            }
        }
        .classic-nav .classic-nav-brand,
        .classic-nav .classic-nav-link,
        .classic-nav .classic-nav-menu-btn {
            color: #ffffff;
            transition: color 0.7s ease;
        }
        .classic-nav .classic-nav-link:hover,
        .classic-nav .classic-nav-menu-btn:hover {
            color: rgba(255, 255, 255, 0.75);
        }
        .classic-nav .classic-nav-logo {
            transition: filter 0.7s ease;
        }
        .classic-nav:not(.nav-scrolled) .classic-nav-logo {
            filter: brightness(0) invert(1);
        }
        .classic-nav.nav-scrolled .classic-nav-brand {
            color: #2d2825;
        }
        .classic-nav.nav-scrolled .classic-nav-link {
            color: ${primaryColor};
        }
        .classic-nav.nav-scrolled .classic-nav-link:hover {
            color: ${primaryColor};
            opacity: 0.8;
        }
        .classic-nav.nav-scrolled .classic-nav-menu-btn {
            color: #2d2825;
        }
        .classic-nav.nav-scrolled .classic-nav-menu-btn:hover {
            color: ${primaryColor};
        }
        .classic-nav.nav-scrolled .classic-nav-logo {
            filter: none;
        }
        .about-section-label {
            font-family: 'Heebo', sans-serif;
            font-size: 11px;
            letter-spacing: 0.32em;
            text-transform: uppercase;
            color: rgba(45, 40, 37, 0.5);
        }
        .about-title {
            font-family: 'Frank Ruhl Libre', serif;
            font-size: clamp(2rem, 3.8vw, 3.1rem);
            line-height: 1.28;
            font-weight: 700;
            color: #2d2825;
        }
        .about-title-underline {
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 6px;
        }
        .about-body-primary {
            font-family: 'Heebo', sans-serif;
            font-size: 18px;
            line-height: 1.9;
            color: rgba(45, 40, 37, 0.82);
        }
        .about-body-secondary {
            font-family: 'Heebo', sans-serif;
            font-size: 16px;
            line-height: 1.85;
            color: rgba(45, 40, 37, 0.65);
        }
        .about-stat-number {
            font-family: 'Frank Ruhl Libre', serif;
            font-size: clamp(2rem, 3vw, 2.75rem);
            line-height: 1;
            font-weight: 400;
            color: #2d2825;
        }
        .about-stat-label {
            font-family: 'Heebo', sans-serif;
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: rgba(45, 40, 37, 0.42);
            margin-top: 10px;
        }
        .about-image-quote {
            background: rgba(255, 255, 255, 0.96);
            padding: 22px 26px;
            box-shadow: 0 16px 40px rgba(45, 40, 37, 0.08);
        }
        .about-image-quote-text {
            font-family: 'Frank Ruhl Libre', serif;
            font-size: 1.05rem;
            line-height: 1.65;
            font-style: italic;
            color: #2d2825;
            text-align: right;
        }
        .about-image-quote-line {
            width: 36px;
            height: 1px;
            background: ${primaryColor};
            margin: 14px 0 10px auto;
        }
        .about-image-quote-name {
            font-family: 'Heebo', sans-serif;
            font-size: 12px;
            letter-spacing: 0.12em;
            color: rgba(45, 40, 37, 0.5);
            text-align: left;
        }
        .about-glow {
            position: absolute;
            pointer-events: none;
            z-index: 0;
            border-radius: 9999px;
        }
        .about-glow-left {
            top: 0;
            left: 0;
            width: 440px;
            height: 440px;
            transform: translate(-58%, -28%);
            filter: blur(58px);
            opacity: 0.72;
        }
        .about-glow-right {
            top: 0;
            right: 0;
            width: 480px;
            height: 480px;
            transform: translate(58%, -28%);
            filter: blur(64px);
            opacity: 0.78;
        }
        .classic-testimonials-carousel {
            overflow: hidden;
            width: 100%;
            padding-bottom: 1rem;
            padding-left: 1.15rem;
        }
        .classic-testimonials-track {
            display: flex;
            transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
            direction: ltr;
        }
        .classic-testimonials-slide {
            flex: 0 0 100%;
            width: 100%;
            box-sizing: border-box;
            direction: rtl;
        }
        .classic-testimonials-dots {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-top: 2rem;
        }
        .classic-testimonials-dot {
            width: 8px;
            height: 8px;
            border-radius: 9999px;
            background: rgba(45, 40, 37, 0.22);
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.35s ease;
        }
        .classic-testimonials-dot.is-active {
            width: 28px;
            background: ${primaryColor};
        }
        ${UNIFIED_GALLERY_GRID_CSS}
        ${TESTIMONIAL_THUMB_CARD_CSS}
        ${HERO_SLIDESHOW_CSS}
        ${sectionBgCss}
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "surface-container-lowest": "#ffffff",
                      "on-error": "#ffffff",
                      "on-error-container": "#93000a",
                      "primary-fixed": "#ffdf93",
                      "on-surface-variant": "#5a504a",
                      "on-surface": "#2d2825",
                      "on-tertiary": "#ffffff",
                      "primary-container": "#f1e3da",
                      "on-primary": "#ffffff",
                      "background": "#FAF7F4",
                      "inverse-surface": "#34302e",
                      "surface-container-highest": "#e8e1da",
                      "surface-container-high": "#efe7df",
                      "surface-container": "#f4ede6",
                      "tertiary-fixed-dim": "#e7c365",
                      "inverse-primary": "#eec148",
                      "error": "#ba1a1a",
                      "on-tertiary-fixed-variant": "#594400",
                      "surface-container-low": "#faf3eb",
                      "on-background": "#2d2825",
                      "on-secondary": "#ffffff",
                      "on-secondary-fixed": "#261a00",
                      "surface-tint": "${primaryColor}",
                      "secondary-fixed-dim": "#d9c4a0",
                      "surface-dim": "#e1d9ce",
                      "secondary-fixed": "#f6e0bb",
                      "on-secondary-fixed-variant": "#50452d",
                      "inverse-on-surface": "#f8efe4",
                      "secondary": "#7a6a5e",
                      "surface": "#FAF7F4",
                      "on-primary-container": "#4e3325",
                      "primary": "${primaryColor}",
                      "tertiary-container": "#c9a74d",
                      "surface-variant": "#ede1cf",
                      "outline-variant": "#d1c6b4",
                      "surface-bright": "#FAF7F4",
                      "secondary-container": "#f1e3c8",
                      "tertiary": "#8c4a2d",
                      "tertiary-fixed": "#ffdbcf",
                      "on-primary-fixed-variant": "#594400",
                      "on-tertiary-container": "#351000",
                      "primary-fixed-dim": "#eec148",
                      "on-primary-fixed": "#241a00",
                      "on-secondary-container": "#241a00",
                      "error-container": "#ffdad6",
                      "on-tertiary-fixed": "#351000",
                      "outline": "#8a7d75"
              },
              "borderRadius": {
                      "DEFAULT": "4px",
                      "lg": "4px",
                      "xl": "4px",
                      "full": "9999px"
              },
              "spacing": {
                      "md": "16px",
                      "xl": "48px",
                      "lg": "24px",
                      "sm": "8px",
                      "xs": "4px",
                      "xxl": "80px"
              },
              "fontFamily": {
                      "body-lg": ["Heebo"],
                      "headline-sm": ["var(--headline-font)"],
                      "display-lg": ["var(--headline-font)"],
                      "display-lg-mobile": ["var(--headline-font)"],
                      "label-sm": ["Heebo"],
                      "headline-md": ["var(--headline-font)"],
                      "body-md": ["Heebo"]
              },
              "fontSize": {
                      "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
                      "headline-sm": ["26px", {"lineHeight": "1.4", "fontWeight": "600"}],
                      "display-lg": ["68px", {"lineHeight": "1.1", "letterSpacing": "-0.01em", "fontWeight": "700"}],
                      "display-lg-mobile": ["42px", {"lineHeight": "1.2", "fontWeight": "700"}],
                      "label-sm": ["13px", {"lineHeight": "1", "letterSpacing": "0.06em", "fontWeight": "500"}],
                      "headline-md": ["36px", {"lineHeight": "1.3", "fontWeight": "600"}],
                      "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}]
              }
            },
          },
        }
    </script>
</head>
<body class="bg-surface text-on-surface overflow-x-hidden">
${generateSiteNav(siteChrome('classic'))}
<section class="relative h-screen w-full flex items-end justify-start overflow-hidden reveal" id="hero">
<div class="absolute inset-0 z-0 scale-105">
${heroSlideshowHtml}
</div>
<div class="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none z-20 hidden lg:block">
<div class="vertical-text-label whitespace-nowrap">
${studioName} · ${photographerName}
</div>
</div>
<div class="hero-glass-container">
<div class="glass-card-frame w-full lg:w-auto">
<div class="glass-card glass-card-float hero-glass-card pt-8 pb-8 px-6 lg:pt-24 lg:pb-28 lg:px-12 lg:w-[450px] lg:m-5">
<div class="hero-glass-inner">
<div class="hero-glass-copy">
<span class="block font-label-sm text-label-sm text-white/80 tracking-[0.3em] mb-4 md:mb-3 lg:mb-6 uppercase">${studioName}</span>
<h1 class="font-display-lg text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-2 lg:mb-6 leading-tight text-white">${photographerName || 'אפרת כהן'} | צילום</h1>
<p class="font-body-lg text-body-lg text-white/90 mb-0 lg:mb-8 leading-relaxed">תופסים את הקסם שקורה בין הרגעים, בסטייל קלאסי ומרגש.</p>
</div>
<div class="hero-glass-actions">
<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="flex-1 bg-primary text-on-primary px-lg md:px-xl py-md rounded-none font-label-sm text-label-sm hover:brightness-110 hover:-translate-y-1 transition-all shadow-lg active:scale-95 whitespace-nowrap">
                        תיאום פגישה
                    </button>
<button onclick="document.querySelector('#galleries').scrollIntoView({behavior: 'smooth'})" class="flex-1 border border-white/30 text-white px-lg md:px-xl py-md rounded-none font-label-sm text-label-sm hover:bg-white/10 transition-all whitespace-nowrap">
                        לצפייה בגלריות
                    </button>
</div>
</div>
</div>
<span class="glass-card-accent-line hidden lg:block" aria-hidden="true"></span>
</div>
</div>
</section>
${aboutTitle || aboutSubtitle || aboutDescription ? `
<section class="relative w-full py-xxl reveal overflow-hidden" id="about">
<div class="about-glow about-glow-left" style="background: radial-gradient(circle, ${primaryColor}70 0%, ${primaryColor}45 24%, ${primaryColor}22 46%, transparent 72%);"></div>
<div class="about-glow about-glow-right" style="background: radial-gradient(circle, ${primaryColor}80 0%, ${primaryColor}50 26%, ${primaryColor}28 48%, transparent 74%);"></div>
<div class="max-w-7xl mx-auto px-lg relative z-10">
<div class="grid grid-cols-1 md:grid-cols-2 gap-xl md:gap-xxl items-center">
<div class="order-1 space-y-8 md:pr-8">
<span class="about-section-label block">About — קצת עליי</span>
${aboutTitle ? `<h2 class="about-title">${underlineLastWord(aboutTitle)}</h2>` : `<h2 class="about-title">${underlineLastWord('אודות הסטודיו')}</h2>`}
<div class="space-y-6">
${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}
${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}
</div>
${hasStats ? `
<div class="grid grid-cols-3 gap-md md:gap-lg border-t border-outline-variant/15 pt-10 mt-4">
<div class="text-right">
<div class="about-stat-number">${formatStat(statsClients)}</div>
<div class="about-stat-label">לקוחות מרוצים</div>
</div>
<div class="text-right">
<div class="about-stat-number">${formatStat(statsProjects)}</div>
<div class="about-stat-label">תיקי עבודות</div>
</div>
<div class="text-right">
<div class="about-stat-number">${formatStat(statsYears)}</div>
<div class="about-stat-label">שנות ניסיון</div>
</div>
</div>
` : ''}
</div>
<div class="order-2 relative">
<img alt="דיוקן צלמת" class="w-full aspect-[4/5] md:aspect-[3/4] object-cover" src="${aboutImage}"/>
<div class="about-image-quote absolute -bottom-8 -left-6 md:-bottom-10 md:-left-10 max-w-[260px] hidden md:block">
<div class="about-image-quote-line"></div>
<p class="about-image-quote-name">— ${photographerName}</p>
</div>
</div>
</div>
</div>
</section>
` : ''}
<section class="homepage-gallery-section bg-surface-container-low py-xxl reveal" id="galleries">
<div class="homepage-gallery-header px-lg mb-xl">
<div class="text-center">
<h2 class="font-headline-md text-headline-md text-on-surface">עבודות נבחרות</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-sm">מבט אל הרגעים שהפכו לנצח</p>
</div>
</div>
<div class="homepage-gallery-grid">
${generateUnifiedGalleryGridHTML(galleries, 'classic')}
</div>
</section>
${hasPackages ? `
<section class="py-xxl reveal ${hasPackagesBg ? 'contact-section-has-bg border-t border-outline-variant/10' : ''}" id="pricing">
${packagesBgLayers('#fdf8f7', '#f7f3f2')}
<div class="max-w-7xl mx-auto px-lg contact-section-content">
<div class="text-center mb-xl">
<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">השקעה ברגעי קסם</span>
<h2 class="font-headline-md text-headline-md text-on-surface">חבילות צילום</h2>
<div class="w-12 h-px bg-outline-variant mx-auto mt-md"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg lg:gap-xl items-stretch">${generatePackagesHTML('classic')}</div>
</div>
</section>
` : ''}
${hasTestimonials ? `
<section class="testimonials-section py-xxl reveal" id="testimonials">
<div class="max-w-7xl mx-auto px-lg">
<div class="text-center mb-xl">
<h2 class="font-headline-md text-headline-md text-on-surface">לקוחות מספרים</h2>
</div>
<div class="testimonials-section-grid">${generateClassicTestimonialsSection()}
</div>
</div>
</section>
` : ''}
<section class="${hasContactBg ? 'contact-section-has-bg pt-xxl pb-xl reveal border-t border-outline-variant/10' : 'bg-surface-container-low pt-xxl pb-xl reveal border-t border-outline-variant/10'}" id="contact">
${contactBgLayers('#fdf8f7', '#f7f3f2')}
<div class="max-w-7xl mx-auto px-lg contact-section-content">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-xl md:gap-xxl items-start lg:gap-xl lg:gap-xxl">
<div class="lg:col-span-5 space-y-lg">
<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block">צרו קשר</span>
<h2 class="font-headline-md text-headline-md text-on-surface">בואו ניצור זיכרונות יחד</h2>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">השאירו פרטים ואחזור אליכם בהקדם לתיאום פגישת היכרות נעימה, שבה נתכנן את הצילומים המושלמים עבורכם.</p>
<div class="space-y-md pt-lg">
<a class="flex items-center gap-md flex-row-reverse justify-end group transition-colors hover:text-primary" href="tel:050-1234567">
<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">call</span>
<span class="font-body-md text-body-md" dir="ltr">050-1234567</span>
</a>
<a class="flex items-center gap-md flex-row-reverse justify-end group transition-colors hover:text-primary" href="mailto:${email || 'hello@studiogallery.co.il'}">
<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">mail</span>
<span class="font-body-md text-body-md">${email || 'hello@studiogallery.co.il'}</span>
</a>
<div class="flex items-center gap-md flex-row-reverse justify-end">
<span class="material-symbols-outlined text-primary">location_on</span>
<span class="font-body-md text-body-md">מתחם האמנים, תל אביב</span>
</div>
</div>
</div>
<div class="lg:col-span-7">
<form class="${hasContactBg ? 'bg-surface/50 backdrop-blur-sm' : 'bg-surface'} p-xl lg:p-xxl rounded-sm shadow-xl border border-outline-variant/20 stagger-item">
<div class="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">
<div class="space-y-xs">
<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">שם מלא</label>
<input name="name" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="ישראל ישראלי" required="" type="text"/>
</div>
<div class="space-y-xs">
<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">טלפון ליצירת קשר</label>
<input name="phone" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="050-0000000" type="tel"/>
</div>
</div>
<div class="space-y-xs mb-lg">
<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">כתובת אימייל</label>
<input name="email" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="example@email.com" required="" type="email"/>
</div>
<div class="space-y-xs mb-xl">
<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">ספרו לי על האירוע שלכם</label>
<textarea name="message" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 resize-none px-md" placeholder="איזה סוג צילומים אתם מחפשים?" required="" rows="4"></textarea>
</div>
<button class="w-full bg-primary text-on-primary py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-md" type="submit">
                        שלח פנייה
<span class="material-symbols-outlined text-sm">send</span>
</button>
</form>
</div>
</div>
</div>
</section>
${generateSiteFooter(siteChrome('classic'))}
<script>
        ${generateSiteNavScrollScript('classic')}
        
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);
        document.querySelectorAll('.reveal').forEach(el => { observer.observe(el); });
        window.addEventListener('load', () => {
            document.querySelectorAll('.reveal').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight) {
                    el.classList.add('active');
                }
            });
        });

        (function() {
            var carousel = document.getElementById('classic-testimonials-carousel');
            if (!carousel) return;
            var track = carousel.querySelector('.classic-testimonials-track');
            var dots = carousel.querySelectorAll('.classic-testimonials-dot');
            var slides = carousel.querySelectorAll('.classic-testimonials-slide');
            if (!track || slides.length <= 1) return;
            var index = 0;
            var timer;
            function goTo(i) {
                index = ((i % slides.length) + slides.length) % slides.length;
                track.style.transform = 'translateX(-' + (index * 100) + '%)';
                dots.forEach(function(dot, dotIndex) {
                    dot.classList.toggle('is-active', dotIndex === index);
                });
            }
            function next() { goTo(index + 1); }
            function resetTimer() {
                if (timer) clearInterval(timer);
                timer = setInterval(next, 5000);
            }
            dots.forEach(function(dot, dotIndex) {
                dot.addEventListener('click', function() {
                    goTo(dotIndex);
                    resetTimer();
                });
            });
            goTo(0);
            resetTimer();
        })();
    </script>
<script>${HERO_SLIDESHOW_INIT_SCRIPT}</script>
<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>
<script>${contactFormSubmitScript(photographerId)}</script>
</body>
</html>
  `;

  // DARK THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const DarkTheme = () => `
<!DOCTYPE html>
<html class="dark" dir="rtl" lang="he">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, in" style="scroll-behavior: smooth;itial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Space+Grotesk:wght@300;700;800&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
        :root {
            --headline-font: 'Space Grotesk', sans-serif;
            --accent-pink: ${primaryColor};
            --deep-charcoal: "#121217";
            --light-bg: "#FAFAFA";
        }
        body {
            background-color: var(--deep-charcoal);
            color: #F5F5F0;
            font-family: 'Heebo', sans-serif;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }
        .hero-clamp {
            font-size: clamp(3rem, 10vw, 7rem);
            line-height: 0.95;
            letter-spacing: -0.02em;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        ::-webkit-scrollbar {
            width: 4px;
        }
        ::-webkit-scrollbar-track {
            background: #121217;
        }
        ::-webkit-scrollbar-thumb {
            background: ${primaryColor};
        }
        .section-transition-light {
            background-color: #ffffff;
            color: var(--deep-charcoal);
        }
        @keyframes revealUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes revealScale {
            from { transform: scale(1.1); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .reveal-up {
            animation: revealUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .reveal-delay-1 { animation-delay: 0.2s; }
        .reveal-delay-2 { animation-delay: 0.4s; }
        .stagger-grid-item {
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-fuchsia-transition {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-on-scroll.active {
            opacity: 1;
            transform: translateY(0);
        }
        .about-section-label {
            font-family: 'Heebo', sans-serif;
            font-size: 11px;
            letter-spacing: 0.32em;
            text-transform: uppercase;
            color: color-mix(in srgb, ${primaryColor} 72%, #f5f5f0);
        }
        .about-title {
            font-family: 'Frank Ruhl Libre', serif;
            font-size: clamp(2.5rem, 5vw, 4.5rem);
            line-height: 1.05;
            font-weight: 400;
            font-style: italic;
            color: #F5F5F0;
        }
        .about-title-underline {
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 4px;
        }
        .about-body-primary {
            font-family: 'Heebo', sans-serif;
            font-size: 18px;
            line-height: 1.9;
            color: rgba(245, 245, 240, 0.82);
        }
        .about-body-secondary {
            font-family: 'Heebo', sans-serif;
            font-size: 16px;
            line-height: 1.85;
            color: rgba(245, 245, 240, 0.65);
        }
        .about-stat-number {
            font-family: 'Frank Ruhl Libre', serif;
            font-size: clamp(2rem, 3vw, 2.75rem);
            line-height: 1;
            font-weight: 400;
            color: #F5F5F0;
        }
        .about-stat-label {
            font-family: 'Heebo', sans-serif;
            font-size: 11px;
            letter-spacing: 0.08em;
            color: rgba(245, 245, 240, 0.42);
            margin-top: 10px;
        }
        .about-image-quote {
            background: rgba(255, 255, 255, 0.97);
            padding: 22px 26px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
        }
        .about-image-quote-line {
            width: 36px;
            height: 1px;
            background: ${primaryColor};
            margin: 14px 0 10px auto;
        }
        .about-image-quote-name {
            font-family: 'Heebo', sans-serif;
            font-size: 10px;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: ${primaryColor};
            text-align: left;
        }
        .about-glow {
            position: absolute;
            pointer-events: none;
            z-index: 0;
            border-radius: 9999px;
            filter: blur(58px);
        }
        .about-glow-left {
            top: 0;
            left: 0;
            width: 440px;
            height: 440px;
            transform: translate(-58%, -28%);
            opacity: 0.72;
        }
        #about .about-inner {
            max-width: 80rem;
            margin-inline: auto;
            padding-inline: clamp(1.5rem, 5vw, 4rem);
            width: 100%;
        }
        .bold-nav .bold-nav-brand,
        .bold-nav .bold-nav-link,
        .bold-nav .bold-nav-menu-btn {
            color: #ffffff;
            transition: color 0.7s ease;
        }
        .bold-nav .bold-nav-link:hover,
        .bold-nav .bold-nav-menu-btn:hover {
            color: rgba(255, 255, 255, 0.75);
        }
        .bold-nav .bold-nav-logo {
            transition: filter 0.7s ease;
        }
        .bold-nav:not(.nav-scrolled) .bold-nav-logo {
            filter: brightness(0) invert(1);
        }
        .bold-nav.nav-scrolled .bold-nav-brand {
            color: #F5F5F0;
        }
        .bold-nav.nav-scrolled .bold-nav-link {
            color: #B8B8C0;
        }
        .bold-nav.nav-scrolled .bold-nav-link:hover {
            color: ${primaryColor};
        }
        .bold-nav.nav-scrolled .bold-nav-menu-btn {
            color: #F5F5F0;
        }
        .bold-nav.nav-scrolled .bold-nav-menu-btn:hover {
            color: ${primaryColor};
        }
        .bold-nav.nav-scrolled .bold-nav-logo {
            filter: none;
        }
        .bold-nav .bold-nav-brand .text-primary {
            color: ${primaryColor};
        }
        .bold-hero-image {
            opacity: 0.72;
            filter: grayscale(10%) brightness(1.14) contrast(1.04);
        }
        .bold-hero-overlay {
            background: linear-gradient(
                to top,
                rgba(18, 18, 23, 0.78) 0%,
                rgba(18, 18, 23, 0.06) 45%,
                rgba(18, 18, 23, 0.42) 100%
            );
        }
        .bold-hero-bottom-merge {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1;
            height: min(28vh, 16rem);
            pointer-events: none;
            background: linear-gradient(
                to bottom,
                rgba(18, 18, 23, 0) 0%,
                rgba(18, 18, 23, 0.65) 62%,
                #121217 100%
            );
        }
        .bold-hero-content {
            position: absolute;
            z-index: 10;
            bottom: 0;
            right: 0;
            left: auto;
            width: 100%;
            max-width: 40rem;
            padding: 1.5rem 1.5rem 3rem 1.5rem;
            text-align: right;
        }
        .bold-hero-label {
            font-family: 'Heebo', sans-serif;
            font-size: 13px;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: ${primaryColor};
        }
        .bold-hero-title {
            font-size: clamp(2.25rem, 5.5vw, 4.25rem);
            line-height: 1.05;
            font-weight: 800;
            letter-spacing: -0.02em;
        }
        .bold-hero-title .text-primary {
            color: ${primaryColor};
        }
        .bold-hero-actions {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
        }
        @media (min-width: 640px) {
            .bold-hero-actions {
                flex-direction: row;
                align-items: center;
            }
        }
        @media (min-width: 768px) {
            .bold-hero-content {
                padding: 2rem 2.5rem 4rem 1.5rem;
            }
        }
        ${UNIFIED_GALLERY_GRID_CSS}
        ${TESTIMONIAL_THUMB_CARD_CSS}
        ${HERO_SLIDESHOW_CSS}
        ${sectionBgCss}
        #contact.contact-section-has-bg .contact-section-bg-desktop,
        #contact.contact-section-has-bg .contact-section-bg-mobile,
        #pricing.contact-section-has-bg .contact-section-bg-desktop,
        #pricing.contact-section-has-bg .contact-section-bg-mobile {
            opacity: 0.72;
            filter: grayscale(10%) brightness(1.14) contrast(1.04);
            -webkit-mask-image: none;
            mask-image: none;
        }
        #contact.contact-section-has-bg .contact-section-bg-overlay {
            background: linear-gradient(
                to top,
                rgba(18, 18, 23, 0.78) 0%,
                rgba(18, 18, 23, 0.06) 45%,
                rgba(18, 18, 23, 0.42) 100%
            );
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "${primaryColor}",
                        "on-primary": "#F5F5F0",
                        "background": "#121217",
                        "surface": "#1A1A22",
                        "light-surface": "#FAFAFA",
                        "on-surface": "#F5F5F0",
                        "on-surface-variant": "#B8B8C0",
                        "outline": "#F5F5F0",
                        "outline-variant": "#3D3D4D",
                        "surface-container-low": "#1E1E26",
                        "surface-dim": "#0D0D12"
                    },
                    borderRadius: {
                        "DEFAULT": "0px",
                        "lg": "0px",
                        "xl": "0px",
                        "full": "0px"
                    },
                    spacing: {
                        "xl": "64px",
                        "md": "20px",
                        "xxl": "120px",
                        "xs": "6px",
                        "sm": "12px",
                        "lg": "32px"
                    },
                    fontFamily: {
                        "headline-md": ["var(--headline-font)"],
                        "display-lg": ["var(--headline-font)"],
                        "headline-sm": ["var(--headline-font)"],
                        "body-md": ["Heebo"],
                        "label-sm": ["Heebo"],
                    },
                    fontSize: {
                        "headline-md": ["32px", {"lineHeight": "1.2", "fontWeight": "800"}],
                        "headline-sm": ["24px", {"lineHeight": "1.3", "fontWeight": "700"}],
                        "display-lg": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800"}],
                        "body-md": ["17px", {"lineHeight": "1.7", "fontWeight": "400"}],
                        "label-sm": ["13px", {"lineHeight": "1", "letterSpacing": "0.08em", "fontWeight": "500"}]
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-background text-on-surface">
${generateSiteNav(siteChrome('dark'))}
<section class="relative min-h-[90vh] flex items-end overflow-hidden" id="hero">
<div class="absolute inset-0 z-0">
${heroSlideshowBoldHtml}
<div class="bold-hero-overlay absolute inset-0"></div>
<div class="bold-hero-bottom-merge"></div>
</div>
<div class="bold-hero-content">
<span class="bold-hero-label mb-lg block opacity-0 reveal-up">Premium Studio</span>
<h1 class="bold-hero-title text-on-surface mb-md opacity-0 reveal-up reveal-delay-1">
                    ${brandLastWord(studioName)}
                </h1>
<p class="font-body-md text-body-md max-w-xl mb-xl opacity-0 reveal-up reveal-delay-2 text-on-surface-variant leading-relaxed">
                    ${aboutText}
                </p>
<div class="bold-hero-actions flex flex-col sm:flex-row gap-lg opacity-0 reveal-up reveal-delay-2">
<button onclick="document.querySelector('#gallery').scrollIntoView({behavior: 'smooth'})" class="border border-primary text-primary bg-transparent px-xxl py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary hover:text-on-primary">
                        צפו בגלריה
                    </button>
<button onclick="document.querySelector('#about').scrollIntoView({behavior: 'smooth'})" class="text-on-surface font-label-sm uppercase tracking-widest border-b border-on-surface/30 hover:border-primary btn-fuchsia-transition py-xs">
                        הסיפור שלנו
                    </button>
</div>
</div>
</section>
${aboutTitle || aboutSubtitle || aboutDescription ? `
<section class="relative w-full py-xl md:py-xxl reveal-on-scroll overflow-hidden" id="about">
<div class="about-glow about-glow-left" style="background: radial-gradient(circle, ${primaryColor}70 0%, ${primaryColor}45 24%, ${primaryColor}22 46%, transparent 72%);"></div>
<div class="about-inner relative z-10">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-xxl items-center">
<div class="lg:col-span-5 relative">
<img alt="דיוקן צלמת" class="w-full aspect-[4/5] object-cover" src="${aboutImage}"/>
<div class="about-image-quote absolute -bottom-10 -right-6 md:-right-12 max-w-[260px] hidden md:block">
<div class="about-image-quote-line"></div>
<p class="about-image-quote-name">— ${photographerName}</p>
</div>
</div>
<div class="lg:col-span-7">
<span class="about-section-label block mb-6">About · קצת עליי</span>
${aboutTitle ? `<h2 class="about-title mb-8">${underlineLastWord(aboutTitle)}</h2>` : '<h2 class="about-title mb-8">החזון שלנו הוא לתעד רגעים שחיים לנצח</h2>'}
<div class="space-y-5">
${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}
${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}
</div>
${hasStats ? `
<div class="grid grid-cols-3 gap-lg pt-12 mt-4 max-w-xl">
<div class="text-right">
<div class="about-stat-number">${formatStat(statsClients)}</div>
<div class="about-stat-label">לקוחות מרוצים</div>
</div>
<div class="text-right">
<div class="about-stat-number">${formatStat(statsProjects)}</div>
<div class="about-stat-label">תיקי עבודות</div>
</div>
<div class="text-right">
<div class="about-stat-number">${formatStat(statsYears)}</div>
<div class="about-stat-label">שנות ניסיון</div>
</div>
</div>
` : ''}
</div>
</div>
</div>
</section>
` : ''}
<section class="homepage-gallery-section py-xl md:py-xxl reveal-on-scroll" id="gallery">
<div class="homepage-gallery-header px-lg mb-lg md:mb-xxl">
<div class="flex flex-row-reverse justify-between items-end">
<div>
<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Portfolio</span>
<h2 class="font-headline-md text-headline-md">תיק עבודות נבחר</h2>
</div>
</div>
</div>
<div class="homepage-gallery-grid">
${generateUnifiedGalleryGridHTML(galleries, 'dark')}
</div>
</section>
${hasPackages ? (hasPackagesBg ? `
<section class="py-xl md:py-xxl container mx-auto px-lg reveal-on-scroll contact-section-has-bg" id="pricing">
${packagesBgLayers('#ffffff', '#ffffff')}
<div class="contact-section-content">
<div class="text-center mb-xl md:mb-xxl max-w-2xl mx-auto">
<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Investment</span>
<h2 class="font-headline-md text-headline-md mb-md text-background">חבילות וצילום</h2>
<p class="text-background/60 font-body-md">אנחנו מציעים מגוון אפשרויות שיתאימו לצרכים האישיים והעסקיים שלכם, עם דגש על איכות בלתי מתפשרת.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg lg:gap-xl items-stretch">${generatePackagesHTML('dark')}</div>
</div>
</section>
` : `
<section class="section-transition-light py-xl md:py-xxl reveal-on-scroll" id="pricing">
<div class="container mx-auto px-lg">
<div class="text-center mb-xl md:mb-xxl max-w-2xl mx-auto">
<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Investment</span>
<h2 class="font-headline-md text-headline-md mb-md text-background">חבילות וצילום</h2>
<p class="text-background/60 font-body-md">אנחנו מציעים מגוון אפשרויות שיתאימו לצרכים האישיים והעסקיים שלכם, עם דגש על איכות בלתי מתפשרת.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg lg:gap-xl items-stretch">${generatePackagesHTML('dark')}</div>
</div>
</section>
`) : ''}
${hasTestimonials ? `
<section class="testimonials-section py-xl md:py-xxl container mx-auto px-lg reveal-on-scroll" id="testimonials">
<div class="text-center mb-xl md:mb-xxl">
<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">Kind Words</span>
<h2 class="font-headline-md text-headline-md">מה הלקוחות שלנו אומרים</h2>
</div>
<div class="testimonials-section-grid">${generateTestimonialsHTML('dark')}</div>
</section>
` : ''}
<section class="py-md md:py-lg bg-background text-on-surface overflow-hidden whitespace-nowrap border-y border-white/10">
<div class="inline-block animate-marquee font-headline-sm text-[20px] md:text-headline-sm uppercase tracking-[0.2em] opacity-30">
                ${studioName}   •   Fashion Editorial   •   Glamour Reality   •   High-End Photography   •   Visual Art   •   ${studioName}   •   Fashion Editorial   •   Glamour Reality   •
            </div>
<style>
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            </style>
</section>
<section class="pt-xl md:pt-xxl pb-xl container mx-auto px-lg reveal-on-scroll ${hasContactBg ? 'contact-section-has-bg' : ''}" id="contact">
${contactBgLayers('#120f0d', '#1a1614')}
<div class="max-w-4xl mx-auto text-center contact-section-content">
<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">Join the Studio</span>
<h2 class="font-headline-md text-headline-md mb-md">בואו ניצור משהו בלתי נשכח</h2>
<p class="font-body-md mb-xl text-on-surface-variant max-w-xl mx-auto opacity-70">השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או צילומים.</p>
<form class="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-2xl mx-auto text-right">
<div class="border-b border-outline-variant">
<input name="name" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="שם מלא" required="" type="text"/>
</div>
<div class="border-b border-outline-variant">
<input name="email" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="כתובת אימייל" required="" type="email"/>
</div>
<div class="border-b border-outline-variant">
<input name="phone" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="טלפון" type="tel"/>
</div>
<div class="border-b border-outline-variant">
<input name="subject" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="נושא" type="text"/>
</div>
<div class="md:col-span-2 border-b border-outline-variant">
<textarea name="message" required class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 min-h-[120px]" placeholder="ההודעה שלך"></textarea>
</div>
<div class="md:col-span-2 flex justify-center mt-md">
<button type="submit" class="bg-primary text-on-primary px-xxl py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary/90 active:scale-95">
            שלח הודעה
        </button>
</div>
</form>
</div>
</section>
</main>
${generateSiteFooter(siteChrome('dark'))}
<script>
        window.addEventListener('load', () => {
            const revealOnScroll = () => {
                const reveals = document.querySelectorAll('.reveal-on-scroll');
                reveals.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    if (rect.top < windowHeight * 0.85) {
                        el.classList.add('active');
                    }
                });
            };
            revealOnScroll();
        });
        window.addEventListener('scroll', () => {
            const revealOnScroll = () => {
                const reveals = document.querySelectorAll('.reveal-on-scroll');
                reveals.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    if (rect.top < windowHeight * 0.85) {
                        el.classList.add('active');
                    }
                });
            };
            revealOnScroll();
        });
        ${generateSiteNavScrollScript('dark')}
        ${HERO_SLIDESHOW_FILM_INIT_SCRIPT}
        
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    </script>
<script>${HERO_SLIDESHOW_INIT_SCRIPT}</script>
<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>
<script>${contactFormSubmitScript(photographerId)}</script>
</body>
</html>
  `;

  // Return the appropriate theme HTML
  switch (theme) {
    case 'modern':
      return ModernTheme()
    case 'classic':
      return ClassicTheme()
    case 'dark':
      return DarkTheme()
    case 'elegant':
    default:
      return ElegantTheme()
  }
}
