export type ElegantThemeContext = {
  htmlAttrs: any
  documentHead: any
  primaryColor: any
  UNIFIED_GALLERY_GRID_CSS: any
  HOMEPAGE_PACKAGES_GRID_CSS: any
  POSTS_PACKAGES_TRANSITION_CSS: any
  RECENT_PHOTOS_GRID_CSS: any
  HOMEPAGE_STAGGER_REVEAL_CSS: any
  TESTIMONIAL_THUMB_CARD_CSS: any
  FAQ_ACCORDION_CSS: any
  elegantFaqSectionCss: any
  HERO_SLIDESHOW_CSS: any
  heroVideoCss: any
  sectionBgCss: any
  HOMEPAGE_LTR_CSS: any
  generateSiteNavMobileStyles: any
  brandFontVarsStyle: any
  generateSiteNav: any
  siteChrome: any
  heroSlideshowHtml: any
  glassHeroTitle: any
  studioName: any
  aboutTextHtml: any
  heroGalleryAnchor: any
  homepageCopy: any
  hasStats: any
  formatStat: any
  statsYears: any
  statsClients: any
  statsProjects: any
  aboutTitle: any
  aboutSubtitle: any
  aboutDescription: any
  elegantSectionHeading: any
  aboutImageHtml: any
  isPortfolioMode: any
  galleriesSectionTitle: any
  generateUnifiedGalleryGridHTML: any
  galleries: any
  siteLanguage: any
  recentPhotosSectionTitle: any
  portfolioCtaHtml: any
  generateRecentPhotosGridHTML: any
  postsSectionHtml: any
  hasPackages: any
  aboutAmbientBackgroundHtml: any
  packagesSectionCopy: any
  escapeHtml: any
  packagesGridClass: any
  generatePackagesHTML: any
  hasTestimonials: any
  testimonialsSectionTitle: any
  generateTestimonialsSection: any
  generateFaqSectionHTML: any
  hasContactBg: any
  contactBgLayers: any
  contactSectionCopy: any
  email: any
  contactAlign: any
  contactLtrDir: any
  contactLtrAlign: any
  generateContactPrivacyConsentHTML: any
  generateElegantContactDetailsHTML: any
  generateSiteFooter: any
  generateSiteNavScrollScript: any
  generateLogoColoringScript: any
  HERO_SLIDESHOW_INIT_SCRIPT: any
  heroVideoScriptHtml: any
  TESTIMONIALS_EQUAL_HEIGHT_SCRIPT: any
  TESTIMONIALS_MARQUEE_INIT_SCRIPT: any
  TESTIMONIALS_CAROUSEL_INIT_SCRIPT: any
  HOMEPAGE_GALLERY_REVEAL_SCRIPT: any
  RECENT_PHOTOS_REVEAL_SCRIPT: any
  HOMEPAGE_STAGGER_REVEAL_SCRIPT: any
  sectionScrollScript: any
  contactFormSubmitScript: any
  photographerId: any
}

export function generateElegantHomepageHTML(ctx: ElegantThemeContext): string {
  const {
    htmlAttrs, documentHead, primaryColor, UNIFIED_GALLERY_GRID_CSS, HOMEPAGE_PACKAGES_GRID_CSS,
    POSTS_PACKAGES_TRANSITION_CSS, RECENT_PHOTOS_GRID_CSS, HOMEPAGE_STAGGER_REVEAL_CSS,
    TESTIMONIAL_THUMB_CARD_CSS, FAQ_ACCORDION_CSS, elegantFaqSectionCss, HERO_SLIDESHOW_CSS,
    heroVideoCss, sectionBgCss, HOMEPAGE_LTR_CSS, generateSiteNavMobileStyles, brandFontVarsStyle,
    generateSiteNav, siteChrome, heroSlideshowHtml, glassHeroTitle, studioName, aboutTextHtml,
    heroGalleryAnchor, homepageCopy, hasStats, formatStat, statsYears, statsClients, statsProjects,
    aboutTitle, aboutSubtitle, aboutDescription, elegantSectionHeading, aboutImageHtml,
    isPortfolioMode, galleriesSectionTitle, generateUnifiedGalleryGridHTML, galleries, siteLanguage,
    recentPhotosSectionTitle, portfolioCtaHtml, generateRecentPhotosGridHTML, postsSectionHtml,
    hasPackages, aboutAmbientBackgroundHtml, packagesSectionCopy, escapeHtml, packagesGridClass,
    generatePackagesHTML, hasTestimonials, testimonialsSectionTitle, generateTestimonialsSection,
    generateFaqSectionHTML, hasContactBg, contactBgLayers, contactSectionCopy, email, contactAlign,
    contactLtrDir, contactLtrAlign, generateContactPrivacyConsentHTML, generateElegantContactDetailsHTML,
    generateSiteFooter, generateSiteNavScrollScript, generateLogoColoringScript, HERO_SLIDESHOW_INIT_SCRIPT,
    heroVideoScriptHtml, TESTIMONIALS_EQUAL_HEIGHT_SCRIPT, TESTIMONIALS_MARQUEE_INIT_SCRIPT,
    TESTIMONIALS_CAROUSEL_INIT_SCRIPT, HOMEPAGE_GALLERY_REVEAL_SCRIPT, RECENT_PHOTOS_REVEAL_SCRIPT,
    HOMEPAGE_STAGGER_REVEAL_SCRIPT, sectionScrollScript, contactFormSubmitScript, photographerId,
  } = ctx

  return `

<!DOCTYPE html>

<html class="scroll-smooth" ${htmlAttrs} style="scroll-behavior: smooth;">

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

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

                    "display": ["var(--headline-font)"],

                    "body": ["Heebo", "sans-serif"],

                    "serif-hebrew": ["var(--about-title-font)"]

            }

          },

        },

      }

    </script>

<style>

        :root {

            --headline-font: 'Playfair Display', serif;

            --about-title-font: 'Frank Ruhl Libre', serif;

        }

        body {

            background-color: #FAFAF8;

            color: #0F0F0D;

            font-family: 'Heebo', sans-serif;

            overflow-x: hidden;

        }

        .font-display {

            font-family: var(--headline-font);

        }

        

        .elegant-accent { color: ${primaryColor}; }

        .elegant-bg-accent { background-color: ${primaryColor}; }

        .elegant-border-accent { border-color: ${primaryColor}; }



        .elegant-contact-details {

            backdrop-filter: blur(2px);

        }

        .elegant-contact-details__item {

            display: flex;

            flex-direction: column;

            align-items: center;

            gap: 0.75rem;

            min-width: 8.75rem;

            text-align: center;

        }

        .elegant-contact-details__icon {

            font-size: 1.75rem;

            color: ${primaryColor};

        }

        .elegant-contact-details__label {

            font-size: 10px;

            text-transform: uppercase;

            letter-spacing: 0.2em;

            opacity: 0.4;

        }

        .elegant-contact-details__value {

            font-weight: 300;

            opacity: 0.75;

            font-size: 0.95rem;

            line-height: 1.5;

            max-width: 14rem;

        }



        .elegant-section-heading {

            display: inline-grid;

            justify-items: center;

            align-items: last baseline;

            max-width: 100%;

        }

        .elegant-section-heading--center {

            display: grid;

            width: 100%;

            text-align: center;

        }

        .elegant-section-heading__watermark,

        .elegant-section-heading__title {

            grid-area: 1 / 1;

            margin: 0;

            padding: 0;

            line-height: 1;

        }

        .elegant-section-heading__watermark {

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

        .elegant-section-heading__title {

            position: relative;

            z-index: 1;

            font-family: var(--headline-font, 'Heebo'), 'Heebo', sans-serif;

        }

        .elegant-section-heading--on-dark .elegant-section-heading__watermark {

            opacity: 0.2;

        }

        @media (max-width: 767px) {

            .elegant-section-heading {

                display: grid;

                width: 100%;

                text-align: center;

            }

            .elegant-section-heading__watermark {

                font-size: clamp(2.35rem, 9vw, 4rem);

                letter-spacing: 0.03em;

            }

            .homepage-gallery-header > div,

            .recent-photos-header > div {

                justify-content: flex-start !important;

                align-items: flex-end !important;

                display: flex;

                flex-direction: column;

                text-align: right !important;

            }

            #about .grid {

                justify-items: center;

                text-align: center;

            }

            #about .grid > div {

                display: flex;

                flex-direction: column;

                align-items: center;

                text-align: center;

                width: 100%;

            }

            #about .grid > div.order-1 {

                width: calc(100vw - 1.25rem);

                max-width: calc(100vw - 1.25rem);

                margin-inline: calc(50% - 50vw + 0.625rem);

            }

            #about .image-reveal {

                width: 100%;

                max-width: none;

                aspect-ratio: 3 / 4;

                min-height: 72vw;

            }

        }

        

        .glass-hero-wrapper {

            position: absolute;

            z-index: 100;

            top: auto;

            bottom: 4.5rem;

            left: 2rem;

            transform: none;

            width: 100%;

            max-width: 28rem;

        }

        .glass-hero-wrapper::before {

            content: '';

            position: absolute;

            inset: -25% -20%;

            background: radial-gradient(ellipse at 50% 55%, color-mix(in srgb, ${primaryColor} 28%, transparent) 0%, transparent 72%);

            filter: blur(28px);

            z-index: -1;

            pointer-events: none;

            opacity: 0.6;

        }

        .glass-hero {

            position: relative;

            overflow: hidden;

            background: linear-gradient(165deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 52%, rgba(255, 255, 255, 0.06) 100%);

            backdrop-filter: blur(20px) saturate(1.2);

            -webkit-backdrop-filter: blur(20px) saturate(1.2);

            border: 1px solid rgba(255, 255, 255, 0.18);

            border-radius: 16px;

            box-shadow:

                0 24px 70px rgba(0, 0, 0, 0.14),

                0 10px 28px rgba(0, 0, 0, 0.06),

                inset 0 1px 1px rgba(255, 255, 255, 0.22);

            animation: gentleFloat 6s ease-in-out infinite;

            width: 100%;

            max-width: 28rem;

            padding: 3.5rem 3.25rem;

        }

        .glass-hero::before {

            content: '';

            position: absolute;

            top: -60%;

            left: -30%;

            width: 70%;

            height: 220%;

            background: linear-gradient(108deg, transparent 42%, rgba(255, 255, 255, 0.1) 50%, transparent 58%);

            transform: rotate(-10deg);

            pointer-events: none;

            animation: glassShine 9s ease-in-out infinite;

        }

        .glass-hero::after {

            content: '';

            position: absolute;

            bottom: 0;

            left: 12%;

            right: 12%;

            height: 1px;

            background: linear-gradient(90deg, transparent, color-mix(in srgb, ${primaryColor} 75%, white), transparent);

            box-shadow: 0 0 22px 5px color-mix(in srgb, ${primaryColor} 22%, transparent);

            pointer-events: none;

        }

        .glass-hero__glow-bar {

            width: 3.5rem;

            height: 3px;

            margin: 0 auto 1.5rem;

            border-radius: 999px;

            background: linear-gradient(90deg, transparent, ${primaryColor}, transparent);

            box-shadow: 0 0 18px color-mix(in srgb, ${primaryColor} 55%, transparent);

            animation: glowPulse 3.5s ease-in-out infinite;

        }

        @keyframes glassShine {

            0%, 100% { opacity: 0.35; transform: rotate(-10deg) translateX(0); }

            50% { opacity: 0.85; transform: rotate(-10deg) translateX(18%); }

        }

        @keyframes glowPulse {

            0%, 100% { opacity: 0.55; transform: scaleX(1); }

            50% { opacity: 1; transform: scaleX(1.18); }

        }

        .glass-hero-title {

            font-family: 'Heebo', sans-serif;

            font-weight: 300;

            letter-spacing: 0.04em;

            line-height: 1.2;

            max-width: 100%;

        }

        .glass-hero-title__line {

            display: block;

        }

        .glass-hero__text {

            max-width: 100%;
            white-space: pre-line;

        }

        @media (max-width: 1023px) {

            .glass-hero-wrapper {

                top: auto;

                bottom: 1.25rem;

                left: 50%;

                right: auto;

                transform: translateX(-50%);

                width: calc(100% - 2.5rem);

                max-width: 26rem;

            }

            .glass-hero {

                width: 100%;

                max-width: none;

                padding: 1.75rem 1.5rem;

            }

            .glass-hero-wrapper::before {

                inset: -18% -12%;

                filter: blur(20px);

            }

        }

        @media (max-width: 767px) {

            .glass-hero {

                padding: 1.125rem 1rem;

            }

            .glass-hero__glow-bar {

                width: 2.5rem;

                margin-bottom: 0.625rem;

            }

            .glass-hero-title {

                margin-bottom: 0 !important;

                font-size: 1.625rem;

                line-height: 1.08;

            }

            .glass-hero-title__line {

                line-height: 1.08;

            }

            .glass-hero__text {

                margin-top: 0 !important;

                margin-bottom: 0.875rem !important;

                font-size: 0.9375rem;

                line-height: 1.45;

            }

            .glass-hero .flex button {

                padding-top: 0.75rem;

                padding-bottom: 0.75rem;

                padding-left: 2rem;

                padding-right: 2rem;

            }

        }

        @media (min-width: 768px) and (max-width: 1023px) {

            .glass-hero-wrapper {

                bottom: 1.75rem;

                max-width: 34rem;

            }

            .glass-hero {

                padding: 2rem 2.25rem;

            }

        }

        @media (max-width: 1023px) {

            #contact.elegant-contact-section--has-bg {

                padding-top: 0;

                background-color: #1c1b1b;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-form-area.contact-section-has-bg {

                position: relative;

                overflow: hidden;

                padding-top: 8rem;

                padding-bottom: 1.25rem;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-form-area .contact-section-bg-mobile {

                opacity: 0.4;

                filter: brightness(1.45) saturate(0.68) contrast(0.9);

                -webkit-mask-image: none;

                mask-image: none;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-form-area .contact-section-bg-overlay {

                background: linear-gradient(to bottom, color-mix(in srgb, #1c1b1b 58%, transparent) 0%, #1c1b1b 100%);

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-details-area {

                background-color: #1c1b1b;

                margin-top: 0;

                padding-top: 0;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-details-area .elegant-contact-details {

                margin-top: 0;

            }

        }

        @media (min-width: 1024px) {

            #contact.elegant-contact-section--has-bg {

                position: relative;

                overflow: hidden;

                padding-top: 8rem;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-form-area.contact-section-has-bg {

                position: static;

                overflow: visible;

                padding-bottom: 0;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-details-area {

                position: relative;

                z-index: 1;

            }

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

        /* Elegant galleries title: flush left with gallery grid */
        .theme-elegant .homepage-gallery-header {
            padding-inline: 2% !important;
            padding-left: 2% !important;
            padding-right: 2% !important;
            text-align: left !important;
            direction: ltr;
        }

        .theme-elegant .homepage-gallery-header > div,
        .theme-elegant .homepage-gallery-header > div.flex {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            text-align: left !important;
            direction: ltr;
            width: 100%;
        }

        .theme-elegant .homepage-gallery-header .elegant-section-heading {
            display: inline-grid !important;
            width: auto !important;
            max-width: 100%;
            margin-left: 0 !important;
            margin-right: auto !important;
            justify-items: start !important;
            justify-content: start !important;
            text-align: left !important;
        }

        .theme-elegant .homepage-gallery-header .elegant-section-heading__watermark,
        .theme-elegant .homepage-gallery-header .elegant-section-heading__title {
            text-align: left !important;
            justify-self: start !important;
            margin-left: 0 !important;
        }

        .theme-elegant .homepage-gallery-header .elegant-section-heading__title {
            direction: rtl;
        }

        @media (max-width: 767px) {
            .theme-elegant .homepage-gallery-header > div,
            .theme-elegant .homepage-gallery-header > div.flex {
                align-items: flex-start !important;
                text-align: left !important;
            }

            .theme-elegant .homepage-gallery-header .elegant-section-heading {
                width: auto !important;
                text-align: left !important;
                justify-items: start !important;
            }
        }

        ${HOMEPAGE_PACKAGES_GRID_CSS}

        ${POSTS_PACKAGES_TRANSITION_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${elegantFaqSectionCss(primaryColor)}

        ${HERO_SLIDESHOW_CSS}

        ${heroVideoCss}

        ${sectionBgCss}

        ${HOMEPAGE_LTR_CSS}

        ${generateSiteNavMobileStyles()}

    </style>

${brandFontVarsStyle}

</head>

<body class="theme-elegant selection:bg-[${primaryColor}] selection:text-white">

${generateSiteNav(siteChrome('elegant'))}

<main>

<section class="relative h-screen overflow-hidden reveal-on-scroll">

<div class="absolute inset-0 z-0 image-reveal active">

${heroSlideshowHtml}

</div>

<div class="glass-hero-wrapper">

<div class="glass-hero text-center">

<div class="glass-hero__glow-bar" aria-hidden="true"></div>

<h1 class="glass-hero-title text-3xl md:text-5xl mb-0 md:mb-6 text-on-surface">${glassHeroTitle(studioName)}</h1>

<p class="glass-hero__text font-body text-lg md:text-xl text-on-surface/70 mb-6 md:mb-10 mx-auto font-light leading-relaxed md:leading-relaxed">${aboutTextHtml}</p>

<div class="flex justify-center">

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="bg-[#0F0F0D] text-white px-12 py-4 text-xs uppercase tracking-[0.3em] hover:bg-accent transition-all duration-300">

                    ${homepageCopy.hero.viewGalleries}

                </button>

</div>

</div>

</div>

</section>

${hasStats ? `

<section class="px-margin-mobile md:px-margin-desktop py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl reveal-on-scroll">

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsYears)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">${homepageCopy.stats.yearsExperience}</span>

</div>

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsClients)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">${homepageCopy.stats.happyClients}</span>

</div>

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsProjects)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">${homepageCopy.stats.portfolios}</span>

</div>

</section>

` : ''}

${aboutTitle || aboutSubtitle || aboutDescription ? `

<section class="px-margin-mobile md:px-margin-desktop py-32 max-w-7xl mx-auto reveal-on-scroll relative" id="about">

<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70"></div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">

<div class="order-2 lg:order-1 max-w-2xl">

<span class="elegant-accent font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">${homepageCopy.about.label}</span>

${aboutTitle ? elegantSectionHeading(aboutTitle, 'ABOUT', { titleClass: 'mb-4' }) : ''}

${aboutSubtitle ? `<p class="font-body text-lg mb-6 leading-relaxed opacity-80" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="font-body text-base mb-10 opacity-60 leading-relaxed" style="white-space: pre-line">${aboutDescription}</p>` : ''}

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="border border-[#0F0F0D] px-10 py-3 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all duration-300">

                    ${homepageCopy.hero.viewGalleries}

                </button>

</div>

<div class="order-1 lg:order-2 image-reveal aspect-[4/5] shadow-2xl">

${aboutImageHtml}

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section py-24 bg-white" id="gallery">

<div class="homepage-gallery-header mb-8">

<div class="homepage-gallery-reveal">

${elegantSectionHeading(galleriesSectionTitle, 'COLLECTIONS')}

</div>

</div>

<div class="homepage-gallery-grid homepage-gallery-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'elegant', siteLanguage)}

</div>

</section>

` : ''}

${galleries.some((g: any) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header">

<div class="flex flex-row-reverse justify-between items-end">

${elegantSectionHeading(recentPhotosSectionTitle, 'LATEST')}

${portfolioCtaHtml}

</div>

</div>

<div class="recent-photos-grid recent-photos-grid--elegant">

${generateRecentPhotosGridHTML(galleries, 'elegant')}

</div>

</section>

` : ''}

${postsSectionHtml}

${hasPackages ? `

<section class="py-16 md:py-32 px-margin-mobile md:px-margin-desktop relative" id="pricing">

${aboutAmbientBackgroundHtml}

<div class="mx-auto max-w-7xl relative z-10">

<div class="text-center mb-8 stagger-reveal" data-reveal-delay="0">

${elegantSectionHeading(packagesSectionCopy.title, 'PACKAGES', { center: true })}

<p class="font-body opacity-60 italic">${escapeHtml(packagesSectionCopy.subtitle)}</p>

</div>

<div class="${packagesGridClass}">${generatePackagesHTML('elegant')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section pt-16 pb-8 md:pt-32 md:pb-12" id="testimonials">

<div class="testimonials-section__header reveal-on-scroll">

${elegantSectionHeading(testimonialsSectionTitle, 'RECOMMEND')}

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('elegant')}</div>

</section>

` : ''}

${generateFaqSectionHTML('elegant')}

<section id="contact" class="elegant-contact-section ${hasContactBg ? 'elegant-contact-section--has-bg pb-12' : 'pt-32 pb-12 bg-[#1c1b1b] px-margin-mobile md:px-margin-desktop'} text-white reveal-on-scroll">

<div class="elegant-contact-form-area ${hasContactBg ? 'contact-section-has-bg' : 'px-margin-mobile md:px-margin-desktop'}">

${hasContactBg ? contactBgLayers('#1c1b1b', '#1c1b1b') : ''}

<div class="max-w-4xl mx-auto contact-section-content px-margin-mobile md:px-margin-desktop">

<div class="text-center mb-8">

${elegantSectionHeading(contactSectionCopy.title, 'CONTACT', { center: true, onDark: true })}

<p class="opacity-60 font-light">${escapeHtml(contactSectionCopy.subtitle)}</p>

</div>

${email ? `

<form class="grid grid-cols-1 md:grid-cols-2 gap-10">

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.fullName}</label>

<input name="name" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.name}" type="text"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.email}</label>

<input name="email" required ${contactLtrDir} class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.email}" type="email"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.phone}</label>

<input name="phone" ${contactLtrDir} class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.phone}" type="tel"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.subject}</label>

<input name="subject" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.subject}" type="text"/>

</div>

<div class="md:col-span-2 space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.message}</label>

<textarea name="message" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white min-h-[120px] resize-none ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.messageHelp}"></textarea>

</div>

${generateContactPrivacyConsentHTML('elegant', primaryColor, homepageCopy, 'md:col-span-2')}

<div class="md:col-span-2 flex justify-center mt-6">

<button type="submit" class="elegant-bg-accent text-white px-16 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300">

                        ${homepageCopy.contactForm.submit}

                    </button>

</div>

</form>

` : `<div class="text-center py-20 opacity-40"><p class="font-body text-lg">${homepageCopy.contactForm.noEmail}</p></div>`}

</div>

</div>

<div class="max-w-4xl mx-auto contact-section-content px-margin-mobile md:px-margin-desktop${hasContactBg ? ' elegant-contact-details-area' : ''}">

${generateElegantContactDetailsHTML()}

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

    ${generateLogoColoringScript()}

    

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

${heroVideoScriptHtml}

<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>

<script>${TESTIMONIALS_MARQUEE_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_CAROUSEL_INIT_SCRIPT}</script>

<script>${HOMEPAGE_GALLERY_REVEAL_SCRIPT}</script>

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId, homepageCopy)}</script>

</body>

</html>

  `
}
