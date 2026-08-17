export type DarkThemeContext = {
  htmlAttrs: any
  documentHead: any
  primaryColor: any
  aboutHollowTitleAmbientShadow: any
  UNIFIED_GALLERY_GRID_CSS: any
  HOMEPAGE_PACKAGES_GRID_CSS: any
  POSTS_PACKAGES_TRANSITION_CSS: any
  CLASSIC_PACKAGES_ROWS_CSS: any
  BOLD_PACKAGES_ROWS_CSS: any
  RECENT_PHOTOS_GRID_CSS: any
  HOMEPAGE_STAGGER_REVEAL_CSS: any
  TESTIMONIAL_THUMB_CARD_CSS: any
  FAQ_ACCORDION_CSS: any
  MODERN_FAQ_ACCORDION_CSS: any
  FAQ_SECTION_GLOW_CSS: any
  HERO_SLIDESHOW_CSS: any
  heroVideoCss: any
  sectionBgCss: any
  HOMEPAGE_LTR_CSS: any
  generateSiteNavMobileStyles: any
  brandFontVarsStyle: any
  generateSiteNav: any
  siteChrome: any
  heroSlideshowBoldHtml: any
  homepageCopy: any
  brandLastWord: any
  studioName: any
  aboutTextHtml: any
  heroGalleryAnchor: any
  aboutTitle: any
  aboutSubtitle: any
  aboutDescription: any
  about_image_url: any
  photographerName: any
  boldSectionEyebrow: any
  underlineLastWord: any
  hasStats: any
  formatStat: any
  statsClients: any
  statsProjects: any
  statsYears: any
  isPortfolioMode: any
  escapeHtml: any
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
  generatePackagesHTML: any
  hasTestimonials: any
  testimonialsSectionTitle: any
  generateTestimonialsSection: any
  generateFaqSectionHTML: any
  hasContactBg: any
  contactBgLayers: any
  contactSectionCopy: any
  contactAlign: any
  contactLtrDir: any
  contactLtrAlign: any
  generateContactPrivacyConsentHTML: any
  generateBoldContactDetailsHTML: any
  generateSiteFooter: any
  HOMEPAGE_REVEAL_INIT_SCRIPT: any
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

export function generateDarkHomepageHTML(ctx: DarkThemeContext): string {
  const {
    htmlAttrs, documentHead, primaryColor, aboutHollowTitleAmbientShadow, UNIFIED_GALLERY_GRID_CSS,
    HOMEPAGE_PACKAGES_GRID_CSS, POSTS_PACKAGES_TRANSITION_CSS, CLASSIC_PACKAGES_ROWS_CSS,
    BOLD_PACKAGES_ROWS_CSS, RECENT_PHOTOS_GRID_CSS, HOMEPAGE_STAGGER_REVEAL_CSS, TESTIMONIAL_THUMB_CARD_CSS,
    FAQ_ACCORDION_CSS, MODERN_FAQ_ACCORDION_CSS, FAQ_SECTION_GLOW_CSS, HERO_SLIDESHOW_CSS, heroVideoCss,
    sectionBgCss, HOMEPAGE_LTR_CSS, generateSiteNavMobileStyles, brandFontVarsStyle, generateSiteNav,
    siteChrome, heroSlideshowBoldHtml, homepageCopy, brandLastWord, studioName, aboutTextHtml,
    heroGalleryAnchor, aboutTitle, aboutSubtitle, aboutDescription, about_image_url, photographerName,
    boldSectionEyebrow, underlineLastWord, hasStats, formatStat, statsClients, statsProjects, statsYears,
    isPortfolioMode, escapeHtml, galleriesSectionTitle, generateUnifiedGalleryGridHTML, galleries,
    siteLanguage, recentPhotosSectionTitle, portfolioCtaHtml, generateRecentPhotosGridHTML, postsSectionHtml,
    hasPackages, aboutAmbientBackgroundHtml, packagesSectionCopy, generatePackagesHTML, hasTestimonials,
    testimonialsSectionTitle, generateTestimonialsSection, generateFaqSectionHTML, hasContactBg,
    contactBgLayers, contactSectionCopy, contactAlign, contactLtrDir, contactLtrAlign,
    generateContactPrivacyConsentHTML, generateBoldContactDetailsHTML, generateSiteFooter,
    HOMEPAGE_REVEAL_INIT_SCRIPT, generateSiteNavScrollScript, generateLogoColoringScript,
    HERO_SLIDESHOW_INIT_SCRIPT, heroVideoScriptHtml, TESTIMONIALS_EQUAL_HEIGHT_SCRIPT,
    TESTIMONIALS_MARQUEE_INIT_SCRIPT, TESTIMONIALS_CAROUSEL_INIT_SCRIPT, HOMEPAGE_GALLERY_REVEAL_SCRIPT,
    RECENT_PHOTOS_REVEAL_SCRIPT, HOMEPAGE_STAGGER_REVEAL_SCRIPT, sectionScrollScript,
    contactFormSubmitScript, photographerId,
  } = ctx

  return `

<!DOCTYPE html>

<html class="dark" ${htmlAttrs}>

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Frank+Ruhl+Libre:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Rubik:wght@500;600;700;800&family=Space+Grotesk:wght@300;700;800&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<style>

        :root {

            --headline-font: 'Space Grotesk', sans-serif;

            --about-title-font: 'Rubik', 'Heebo', sans-serif;

            --accent-pink: ${primaryColor};

            --deep-charcoal: "#121217";

            --light-bg: "#FAFAFA";

        }

        .bold-section-eyebrow-wrap {
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            width: 100%;
            direction: ltr;
            text-align: left;
            margin: 0 0 0.25rem;
        }

        .bold-section-eyebrow-wrap--center {
            justify-content: center !important;
            text-align: center;
        }

        .bold-section-eyebrow-wrap--right {
            justify-content: flex-end !important;
            text-align: right;
        }

        .bold-section-eyebrow {
            display: block;
            width: max-content;
            max-width: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Bebas Neue', 'Space Grotesk', sans-serif;
            font-size: clamp(1.35rem, 3.2vw, 2rem);
            font-weight: 400;
            line-height: 0.9;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            direction: ltr;
            text-align: left !important;
            color: transparent;
            -webkit-text-fill-color: transparent;
            -webkit-text-stroke: 1.2px ${primaryColor};
            paint-order: stroke fill;
            transform: skewX(-8deg);
            transform-origin: left center;
            text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.35);
            opacity: 0.95;
            pointer-events: none;
            user-select: none;
        }

        .bold-section-eyebrow-wrap--center .bold-section-eyebrow {
            transform-origin: center;
        }

        .bold-section-eyebrow-wrap--right .bold-section-eyebrow {
            transform-origin: right center;
        }

        .theme-bold #pricing .bold-section-eyebrow-wrap,
        .theme-bold #testimonials .bold-section-eyebrow-wrap {
            justify-content: flex-start !important;
            direction: ltr !important;
        }

        .theme-bold #faq .bold-section-eyebrow-wrap--center,
        .theme-bold #contact .bold-section-eyebrow-wrap--center {
            justify-content: center !important;
        }

        .theme-bold #about .bold-section-eyebrow-wrap--right {
            justify-content: flex-end !important;
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

        .stagger-grid-item {

            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);

        }

        .btn-fuchsia-transition {

            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

        }

        .about-section-label {

            font-family: 'Heebo', sans-serif;

            font-size: 11px;

            letter-spacing: 0.32em;

            text-transform: uppercase;

            color: color-mix(in srgb, ${primaryColor} 72%, #f5f5f0);

        }

        .theme-bold .about-title {

            font-family: var(--about-title-font);

            font-size: clamp(2.5rem, 5vw, 4.5rem);

            line-height: 1.05;

            font-weight: 800;

            font-style: normal;

            letter-spacing: 0.02em;

            color: transparent !important;

            -webkit-text-fill-color: transparent;

            -webkit-text-stroke: 1.5px ${primaryColor};

            paint-order: stroke fill;

            text-shadow: ${aboutHollowTitleAmbientShadow};

        }

        .theme-bold .about-title-underline {

            color: transparent !important;

            -webkit-text-fill-color: transparent;

            border-bottom: none;

            padding-bottom: 0;

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

        .bold-nav .bold-nav-logo:not(.brand-logo-colorable) {

            transition: filter 0.7s ease;

            filter: brightness(0) invert(1) !important;

        }

        .bold-nav:not(.nav-scrolled) .bold-nav-logo:not(.brand-logo-colorable) {

            filter: brightness(0) invert(1) !important;

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

        .bold-nav.nav-scrolled .bold-nav-logo:not(.brand-logo-colorable) {

            filter: brightness(0) invert(1) !important;

        }

        .bold-nav .bold-nav-brand .text-primary {

            color: ${primaryColor};

        }

        .modern-section-subtitle {

            color: ${primaryColor};

        }

        .bold-hero-image {

            opacity: 0.8;

            filter: grayscale(12%) brightness(1.02) contrast(1.02) saturate(0.92);

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

            min-height: min(72vh, 38rem);

            display: flex;

            flex-direction: column;

            align-items: flex-start;

            justify-content: flex-end;

            gap: 5px;

            padding: 1.5rem 1.5rem 2.25rem 1.5rem;

            text-align: right;

        }

        .bold-hero-content::before {

            content: '';

            margin-top: auto;

            flex: 0 0 30px;

            height: 30px;

            width: 100%;

        }

        .bold-hero-label {

            font-family: 'Heebo', sans-serif;

            font-size: 13px;

            font-weight: 800;

            line-height: 1;

            letter-spacing: 0.3em;

            text-transform: uppercase;

            color: ${primaryColor};

            margin: 0;

        }

        .bold-hero-title {

            font-size: clamp(2.25rem, 5.5vw, 4.25rem);

            line-height: 0.92;

            font-weight: 800;

            letter-spacing: -0.02em;

            margin: 0;

        }

        .bold-hero-title .text-primary,
        .bold-hero-title .font-light {

            color: ${primaryColor};

            font-weight: 800;

        }

        .bold-hero-about {

            margin: 0;

            line-height: 1.35 !important;

        }

        .bold-hero-actions {

            display: flex;

            flex-direction: column;

            align-items: flex-start;

            gap: 0.875rem;

            flex-shrink: 0;

            margin-top: 0;

        }

        .bold-hero-btn-gallery {

            width: fit-content;

            max-width: 100%;

            padding-inline: 1.5rem;

        }

        @media (min-width: 640px) {

            .bold-hero-actions {

                flex-direction: row;

                align-items: center;

            }

        }

        @media (min-width: 768px) {

            .bold-hero-content {

                padding: 2rem 2.5rem 2.75rem 1.5rem;

            }

        }

        .bold-contact-details {

            background-color: #121217;

            backdrop-filter: none;

            -webkit-backdrop-filter: none;

        }

        .bold-contact-details__item {

            display: flex;

            flex-direction: column;

            align-items: center;

            gap: 0.75rem;

            min-width: 8.75rem;

            text-align: center;

        }

        .bold-contact-details__icon {

            font-size: 1.75rem;

            color: ${primaryColor};

        }

        .bold-contact-details__label {

            font-family: 'Heebo', sans-serif;

            font-size: 10px;

            text-transform: uppercase;

            letter-spacing: 0.3em;

            opacity: 0.45;

        }

        .bold-contact-details__value {

            font-weight: 400;

            opacity: 0.75;

            font-size: 0.95rem;

            line-height: 1.5;

            max-width: 14rem;

        }

        .bold-contact-form-block.contact-section-has-bg {

            padding-bottom: 2.5rem;

        }

        @media (min-width: 768px) {

            .bold-contact-form-block.contact-section-has-bg {

                padding-bottom: 3.5rem;

            }

        }

        .bold-contact-details-block {

            position: relative;

            z-index: 2;

            background-color: #121217;

        }

        @media (max-width: 767px) {

            .bold-hero-content {

                left: 0;

                right: 0;

                margin-inline: auto;

                display: flex;

                flex-direction: column;

                align-items: center;

                text-align: center;

            }

            .bold-hero-actions {

                align-items: center;

            }

            .bold-hero-btn-gallery {

                white-space: nowrap;

                padding-inline: 1rem;

                letter-spacing: 0.08em;

            }

            #about .about-inner .grid {

                justify-items: center;

                text-align: center;

            }

            #about .about-inner .grid > div {

                display: flex;

                flex-direction: column;

                align-items: center;

                text-align: center;

                width: 100%;

            }

            #about .grid.grid-cols-3 {

                margin-inline: auto;

            }

            #about .grid.grid-cols-3 > div {

                text-align: center;

            }

            .homepage-gallery-header,

            .recent-photos-header {

                text-align: right !important;

            }

            #contact .bold-contact-form-block .contact-section-content {

                text-align: center;

            }

            #contact form {

                width: 100%;

                max-width: none;

                text-align: center;

            }

            #contact form > div {

                width: 100%;

            }

            #contact form input,

            #contact form textarea {

                width: 100%;

                text-align: center;

            }

            #contact .bold-contact-details-block {

                text-align: center;

            }

            #contact .bold-contact-details {

                width: 100%;

                max-width: none;

                margin-inline: 0;

            }

            #contact .bold-contact-details > div {

                flex-direction: column;

                align-items: center;

                gap: 2rem;

            }

            #contact .bold-contact-details__item {

                width: 100%;

                max-width: none;

            }

            #contact .bold-contact-details__value {

                max-width: none;

            }

        }

        ${UNIFIED_GALLERY_GRID_CSS}

        ${HOMEPAGE_PACKAGES_GRID_CSS}

        ${POSTS_PACKAGES_TRANSITION_CSS}

        ${CLASSIC_PACKAGES_ROWS_CSS}

        ${BOLD_PACKAGES_ROWS_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${MODERN_FAQ_ACCORDION_CSS}

        ${FAQ_SECTION_GLOW_CSS}

        ${HERO_SLIDESHOW_CSS}

        ${heroVideoCss}

        ${sectionBgCss}

        .theme-bold .homepage-gallery-header,
        .theme-bold .homepage-gallery-header > div,
        .theme-bold .recent-photos-header,
        .theme-bold .recent-photos-header > div {
            text-align: left !important;
            align-items: flex-start !important;
            direction: ltr;
        }

        .theme-bold .recent-photos-header > div:has(.portfolio-cta-wrap),
        .theme-bold .recent-photos-header > div:not(.hp-posts-header--classic):has(.portfolio-cta-wrap) {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
        }

        #contact .bold-contact-form-block.contact-section-has-bg .contact-section-bg-desktop,

        #contact .bold-contact-form-block.contact-section-has-bg .contact-section-bg-mobile,

        #pricing.contact-section-has-bg .contact-section-bg-desktop,

        #pricing.contact-section-has-bg .contact-section-bg-mobile {

            opacity: 0.48;

            filter: grayscale(6%) brightness(1.42) contrast(0.9) saturate(0.66);

            -webkit-mask-image: none;

            mask-image: none;

        }

        #contact .bold-contact-form-block.contact-section-has-bg .contact-section-bg-overlay {

            background: linear-gradient(

                to top,

                #121217 0%,

                rgba(18, 18, 23, 0.55) 14%,

                rgba(18, 18, 23, 0.02) 42%,

                rgba(18, 18, 23, 0.18) 100%

            );

        }

        #pricing.contact-section-has-bg .contact-section-bg-overlay {

            background: linear-gradient(

                to bottom,

                color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fdf8f7)) 62%, transparent),

                color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fdf8f7)) 97%, transparent)

            );

        }

        ${HOMEPAGE_LTR_CSS}

        ${generateSiteNavMobileStyles()}

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

${brandFontVarsStyle}

</head>

<body class="theme-bold bg-background text-on-surface">

${generateSiteNav(siteChrome('dark'))}

<main>

<section class="relative h-screen w-full flex items-end overflow-hidden reveal" id="hero">

<div class="absolute inset-0 z-0">

${heroSlideshowBoldHtml}

<div class="bold-hero-overlay absolute inset-0"></div>

<div class="bold-hero-bottom-merge"></div>

</div>

<div class="bold-hero-content">

<span class="bold-hero-label block">${homepageCopy.hero.premiumStudio}</span>

<h1 class="bold-hero-title text-on-surface">

                    ${brandLastWord(studioName)}

                </h1>

<p class="bold-hero-about font-body-md text-body-md max-w-xl text-on-surface-variant whitespace-pre-line">

                    ${aboutTextHtml}

                </p>

<div class="bold-hero-actions flex flex-col sm:flex-row">

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="bold-hero-btn-gallery border border-primary text-primary bg-transparent py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary hover:text-on-primary whitespace-nowrap">

                        ${homepageCopy.hero.viewGalleryShort}

                    </button>

<button onclick="document.querySelector('#about').scrollIntoView({behavior: 'smooth'})" class="text-on-surface font-label-sm uppercase tracking-widest border-b border-on-surface/30 hover:border-primary btn-fuchsia-transition py-xs">

                        ${homepageCopy.hero.ourStory}

                    </button>

</div>

</div>

</section>

${aboutTitle || aboutSubtitle || aboutDescription ? `

<section class="relative w-full py-xl md:py-xxl reveal overflow-hidden" id="about">

<div class="about-glow about-glow-left" style="background: radial-gradient(circle, ${primaryColor}70 0%, ${primaryColor}45 24%, ${primaryColor}22 46%, transparent 72%);"></div>

<div class="about-inner relative z-10">

<div class="grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-xxl items-center">

<div class="lg:col-span-5 relative">

${about_image_url ? `<img alt="${homepageCopy.misc.photographerPortraitAlt}" class="w-full aspect-[4/5] object-cover" src="${about_image_url}"/>` : ''}

<div class="about-image-quote absolute -bottom-10 -right-6 md:-right-12 max-w-[260px] hidden md:block">

<div class="about-image-quote-line"></div>

<p class="about-image-quote-name">— ${photographerName}</p>

</div>

</div>

<div class="lg:col-span-7 max-w-2xl">

${boldSectionEyebrow('ABOUT', { align: 'right' })}

${aboutTitle ? `<h2 class="about-title mb-8">${underlineLastWord(aboutTitle)}</h2>` : `<h2 class="about-title mb-8">${underlineLastWord(homepageCopy.about.darkDefaultTitle)}</h2>`}

<div class="space-y-5">

${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}

</div>

${hasStats ? `

<div class="grid grid-cols-3 gap-lg pt-12 mt-4 max-w-xl">

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsClients)}</div>

<div class="about-stat-label">${homepageCopy.stats.happyClients}</div>

</div>

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsProjects)}</div>

<div class="about-stat-label">${homepageCopy.stats.portfolios}</div>

</div>

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsYears)}</div>

<div class="about-stat-label">${homepageCopy.stats.yearsExperience}</div>

</div>

</div>

` : ''}

</div>

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section py-xl md:py-xxl" id="gallery">

<div class="homepage-gallery-header px-lg mb-lg md:mb-xxl text-start homepage-gallery-reveal">

<div>

${boldSectionEyebrow('COLLECTIONS')}

<h2 class="site-section-title font-headline text-4xl font-bold">${escapeHtml(galleriesSectionTitle)}</h2>

</div>

</div>

<div class="homepage-gallery-grid homepage-gallery-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'dark', siteLanguage)}

</div>

</section>

` : ''}

${galleries.some((g: any) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header text-start">

<div class="flex flex-row justify-between items-end gap-md">

<div>

${boldSectionEyebrow('LATEST')}

<h2 class="site-section-title font-headline text-4xl font-bold">${escapeHtml(recentPhotosSectionTitle)}</h2>

</div>

${portfolioCtaHtml}

</div>

</div>

<div class="recent-photos-grid recent-photos-grid--dark">

${generateRecentPhotosGridHTML(galleries, 'dark')}

</div>

</section>

` : ''}

${postsSectionHtml}

${hasPackages ? `

<section class="homepage-packages-section py-xxl reveal relative overflow-hidden" id="pricing">

${aboutAmbientBackgroundHtml}

<div class="homepage-packages-section__inner contact-section-content relative z-10">

<div class="homepage-packages-section__header stagger-reveal" data-reveal-delay="0">

${boldSectionEyebrow('PACKAGES')}

<h2 class="site-section-title font-headline text-4xl font-bold text-on-surface">${escapeHtml(packagesSectionCopy.title)}</h2>

<div class="homepage-packages-section__divider w-12 h-px bg-outline-variant mt-md"></div>

<p class="font-body-md text-body-md text-on-surface-variant mt-md opacity-70">${escapeHtml(packagesSectionCopy.subtitle)}</p>

</div>

<div class="homepage-packages-rows">${generatePackagesHTML('dark')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section py-xxl reveal" id="testimonials">

<div class="testimonials-section__inner contact-section-content relative z-10">

<div class="testimonials-section__header stagger-reveal" data-reveal-delay="0">

${boldSectionEyebrow('RECOMMEND')}

<h2 class="site-section-title font-headline text-4xl font-bold text-on-surface">${escapeHtml(testimonialsSectionTitle)}</h2>

<div class="testimonials-section__divider w-12 h-px bg-outline-variant mt-md"></div>

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('dark')}</div>

</div>

</section>

` : ''}

${generateFaqSectionHTML('dark')}

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

<section class="w-full pb-xl reveal" id="contact">

<div class="bold-contact-form-block ${hasContactBg ? 'contact-section-has-bg pt-xl md:pt-xxl' : 'container mx-auto px-lg pt-xl md:pt-xxl'}">

${hasContactBg ? contactBgLayers('#120f0d', '#1a1614') : ''}

<div class="max-w-4xl mx-auto text-center contact-section-content${hasContactBg ? ' container px-lg' : ''}">

${boldSectionEyebrow('CONTACT', { align: 'center' })}

<h2 class="site-section-title font-headline text-4xl font-bold mb-md">${escapeHtml(contactSectionCopy.title)}</h2>

<p class="font-body-md mb-xl text-on-surface-variant max-w-xl mx-auto opacity-70">${escapeHtml(contactSectionCopy.subtitle)}</p>

<form class="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-2xl mx-auto text-start rtl:text-right">

<div class="border-b border-outline-variant">

<input name="name" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 ${contactAlign}" placeholder="${homepageCopy.contactForm.fullName}" required="" type="text"/>

</div>

<div class="border-b border-outline-variant">

<input name="email" ${contactLtrDir} class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.emailAddress}" required="" type="email"/>

</div>

<div class="border-b border-outline-variant">

<input name="phone" ${contactLtrDir} class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.phone}" type="tel"/>

</div>

<div class="border-b border-outline-variant">

<input name="subject" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.subject}" type="text"/>

</div>

<div class="md:col-span-2 border-b border-outline-variant">

<textarea name="message" required class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 min-h-[120px] ${contactAlign}" placeholder="${homepageCopy.contactForm.yourMessage}"></textarea>

</div>

${generateContactPrivacyConsentHTML('dark', primaryColor, homepageCopy, 'md:col-span-2')}

<div class="md:col-span-2 flex justify-center mt-md">

<button type="submit" class="bg-primary text-on-primary px-xxl py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary/90 active:scale-95">

            ${homepageCopy.contactForm.submit}

        </button>

</div>

</form>

${hasContactBg ? '' : generateBoldContactDetailsHTML()}

</div>

</div>

${hasContactBg ? `<div class="bold-contact-details-block max-w-4xl mx-auto container px-lg">${generateBoldContactDetailsHTML()}</div>` : ''}

</section>

</main>

${generateSiteFooter(siteChrome('dark'))}

<script>${HOMEPAGE_REVEAL_INIT_SCRIPT}</script>

<script>

        ${generateSiteNavScrollScript('dark')}

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
