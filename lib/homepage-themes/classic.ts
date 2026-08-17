export type ClassicThemeContext = {
  htmlAttrs: any
  documentHead: any
  primaryColor: any
  photographer: any
  UNIFIED_GALLERY_GRID_CSS: any
  HOMEPAGE_PACKAGES_GRID_CSS: any
  POSTS_PACKAGES_TRANSITION_CSS: any
  CLASSIC_PACKAGES_ROWS_CSS: any
  RECENT_PHOTOS_GRID_CSS: any
  CLASSIC_RECENT_PHOTOS_HEADER_CSS: any
  HOMEPAGE_STAGGER_REVEAL_CSS: any
  TESTIMONIAL_THUMB_CARD_CSS: any
  CLASSIC_CONTACT_FORM_CSS: any
  FAQ_ACCORDION_CSS: any
  classicFaqSectionCss: any
  HERO_SLIDESHOW_CSS: any
  heroVideoCss: any
  sectionBgCss: any
  HOMEPAGE_LTR_CSS: any
  generateSiteNavMobileStyles: any
  brandFontVarsStyle: any
  generateSiteNav: any
  siteChrome: any
  heroSlideshowHtml: any
  studioName: any
  photographerName: any
  homepageCopy: any
  aboutTextHtml: any
  heroGalleryAnchor: any
  aboutTitle: any
  aboutSubtitle: any
  aboutDescription: any
  classicSectionScript: any
  underlineLastWord: any
  hasStats: any
  formatStat: any
  statsClients: any
  statsProjects: any
  statsYears: any
  about_image_url: any
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
  studioPhone: any
  studioPhoneHref: any
  studioPhoneHtml: any
  email: any
  studioAddress: any
  studioAddressHtml: any
  contactAlign: any
  contactLtrDir: any
  contactLtrAlign: any
  generateSiteFooter: any
  generateSiteNavScrollScript: any
  generateLogoColoringScript: any
  HOMEPAGE_REVEAL_INIT_SCRIPT: any
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

export function generateClassicHomepageHTML(ctx: ClassicThemeContext): string {
  const {
    htmlAttrs, documentHead, primaryColor, photographer, UNIFIED_GALLERY_GRID_CSS,
    HOMEPAGE_PACKAGES_GRID_CSS, POSTS_PACKAGES_TRANSITION_CSS, CLASSIC_PACKAGES_ROWS_CSS,
    RECENT_PHOTOS_GRID_CSS, CLASSIC_RECENT_PHOTOS_HEADER_CSS, HOMEPAGE_STAGGER_REVEAL_CSS,
    TESTIMONIAL_THUMB_CARD_CSS, CLASSIC_CONTACT_FORM_CSS, FAQ_ACCORDION_CSS, classicFaqSectionCss,
    HERO_SLIDESHOW_CSS, heroVideoCss, sectionBgCss, HOMEPAGE_LTR_CSS, generateSiteNavMobileStyles,
    brandFontVarsStyle, generateSiteNav, siteChrome, heroSlideshowHtml, studioName, photographerName,
    homepageCopy, aboutTextHtml, heroGalleryAnchor, aboutTitle, aboutSubtitle, aboutDescription,
    classicSectionScript, underlineLastWord, hasStats, formatStat, statsClients, statsProjects,
    statsYears, about_image_url, isPortfolioMode, escapeHtml, galleriesSectionTitle,
    generateUnifiedGalleryGridHTML, galleries, siteLanguage, recentPhotosSectionTitle, portfolioCtaHtml,
    generateRecentPhotosGridHTML, postsSectionHtml, hasPackages, aboutAmbientBackgroundHtml,
    packagesSectionCopy, generatePackagesHTML, hasTestimonials, testimonialsSectionTitle,
    generateTestimonialsSection, generateFaqSectionHTML, hasContactBg, contactBgLayers, contactSectionCopy,
    studioPhone, studioPhoneHref, studioPhoneHtml, email, studioAddress, studioAddressHtml,
    contactAlign, contactLtrDir, contactLtrAlign, generateSiteFooter, generateSiteNavScrollScript,
    generateLogoColoringScript, HOMEPAGE_REVEAL_INIT_SCRIPT, HERO_SLIDESHOW_INIT_SCRIPT, heroVideoScriptHtml,
    TESTIMONIALS_EQUAL_HEIGHT_SCRIPT, TESTIMONIALS_MARQUEE_INIT_SCRIPT, TESTIMONIALS_CAROUSEL_INIT_SCRIPT,
    HOMEPAGE_GALLERY_REVEAL_SCRIPT, RECENT_PHOTOS_REVEAL_SCRIPT, HOMEPAGE_STAGGER_REVEAL_SCRIPT,
    sectionScrollScript, contactFormSubmitScript, photographerId,
  } = ctx

  return `

<!DOCTYPE html>

<html ${htmlAttrs}>

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@400;700&family=Great+Vibes&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<style>

        :root {

            --headline-font: 'Frank Ruhl Libre', serif;

            --about-title-font: 'Frank Ruhl Libre', serif;

        }

        body {

            font-family: 'Heebo', sans-serif;

            scroll-behavior: smooth;

        }

        .classic-section-script {
            display: block;
            font-family: 'Great Vibes', cursive;
            font-size: clamp(2.25rem, 4.5vw, 3rem);
            font-weight: 400;
            line-height: 1.15;
            letter-spacing: 0.02em;
            text-transform: none;
            margin: 0 0 0.2rem;
            direction: ltr;
            text-align: inherit;
        }

        #about .classic-section-script {
            width: 100%;
            text-align: right;
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

            display: block;

            width: 100%;

            max-width: 450px;

            flex-shrink: 0;

            box-sizing: border-box;

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

            padding: 0 1rem 1rem;

            box-sizing: border-box;

        }

        @media (max-width: 767px) {

            .hero-glass-card {

                padding-top: 1rem !important;

                padding-bottom: 1rem !important;

                padding-left: 0.75rem !important;

                padding-right: 0.75rem !important;

            }

            .hero-glass-inner {

                gap: 0.625rem;

            }

            .hero-glass-copy .font-label-sm {

                margin-bottom: 0.5rem !important;

            }

            .hero-glass-copy h1 {

                margin-bottom: 0.5rem !important;

                line-height: 1.2;

            }

            .hero-glass-actions {

                gap: 0.5rem;

            }

            .hero-glass-actions button {

                padding-top: 0.625rem;

                padding-bottom: 0.625rem;

            }

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

                white-space: pre-line;

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

                right: auto;

                transform: none;

                width: auto;

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
                white-space: pre-line;

            }

        }

        .hero-glass-card {

            width: 100%;

            max-width: 450px;

            height: auto;

            box-sizing: border-box;

        }

        @media (min-width: 1024px) {

            .hero-glass-card {

                width: 450px;

                flex: 0 0 450px;

            }

        }

        .hero-glass-inner {

            display: flex;

            flex-direction: column;

            gap: 1.25rem;

        }

        .hero-glass-copy {

            text-align: center;

            height: auto;

            white-space: normal;

            overflow-wrap: break-word;

            word-break: break-word;

        }

        .hero-glass-copy h1,

        .hero-glass-copy p {

            white-space: normal;

            overflow-wrap: break-word;

            word-break: break-word;

        }

        .hero-glass-actions {

            display: flex;

            flex-direction: row;

            flex-wrap: wrap;

            justify-content: center;

            gap: 0.75rem;

            width: 100%;

        }
        @media (min-width: 1024px) {
            .hero-glass-actions {
                flex-direction: column;
            }
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

            filter: ${photographer.should_color_logo ? 'none' : 'brightness(0) invert(1)'};

        }

        .about-section-label {

            font-family: 'Heebo', sans-serif;

            font-size: 11px;

            letter-spacing: 0.32em;

            text-transform: uppercase;

            color: rgba(45, 40, 37, 0.5);

        }

        .about-title {

            font-family: var(--about-title-font, var(--headline-font));

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

        ${UNIFIED_GALLERY_GRID_CSS}

        ${HOMEPAGE_PACKAGES_GRID_CSS}

        ${POSTS_PACKAGES_TRANSITION_CSS}

        ${CLASSIC_PACKAGES_ROWS_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${CLASSIC_RECENT_PHOTOS_HEADER_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${CLASSIC_CONTACT_FORM_CSS}

        ${FAQ_ACCORDION_CSS}

        ${classicFaqSectionCss(primaryColor)}

        ${HERO_SLIDESHOW_CSS}

        ${heroVideoCss}

        ${sectionBgCss}

        ${HOMEPAGE_LTR_CSS}

        ${generateSiteNavMobileStyles()}

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

${brandFontVarsStyle}

</head>

<body class="theme-classic bg-surface text-on-surface overflow-x-hidden">

${generateSiteNav(siteChrome('classic'))}

<main>

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

<div class="glass-card-frame w-full max-w-[450px] shrink-0">

<div class="glass-card glass-card-float hero-glass-card w-full max-w-[450px] h-auto pt-5 pb-5 px-3 lg:pt-[21px] lg:pb-[27px] lg:px-6 lg:w-[450px] lg:m-5 lg:mt-[calc(1.25rem+10px)] box-border">

<div class="hero-glass-inner">

<div class="hero-glass-copy h-auto whitespace-normal break-words">

<span class="block font-label-sm text-label-sm text-white/80 tracking-[0.3em] mb-2 md:mb-3 lg:mb-6 uppercase whitespace-normal">${studioName}</span>

<h1 class="font-display-lg text-3xl md:text-4xl lg:text-5xl mb-2 md:mb-2 lg:mb-6 leading-tight text-white whitespace-normal break-words">${photographerName} | ${homepageCopy.hero.photographySuffix}</h1>

<p class="font-body-lg text-body-lg text-white/90 mb-0 lg:mb-8 leading-relaxed whitespace-normal break-words">${aboutTextHtml || homepageCopy.about.defaultAboutText}</p>

</div>

<div class="hero-glass-actions">

<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="flex-1 bg-primary text-on-primary px-lg md:px-xl py-2.5 md:py-md rounded-none font-label-sm text-label-sm hover:brightness-110 hover:-translate-y-1 transition-all shadow-lg active:scale-95 whitespace-nowrap">

                        ${homepageCopy.hero.scheduleSession}

                    </button>

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="flex-1 border border-white/30 text-white px-lg md:px-xl py-2.5 md:py-md rounded-none font-label-sm text-label-sm hover:bg-white/10 transition-all whitespace-nowrap">

                        ${homepageCopy.hero.viewGalleries}

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

<div class="order-1 space-y-8 md:pr-8 max-w-2xl">

${classicSectionScript('About')}

${aboutTitle ? `<h2 class="about-title">${underlineLastWord(aboutTitle)}</h2>` : `<h2 class="about-title">${underlineLastWord(homepageCopy.about.defaultTitle)}</h2>`}

<div class="space-y-6">

${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}

</div>

${hasStats ? `

<div class="grid grid-cols-3 gap-md md:gap-lg border-t border-outline-variant/15 pt-10 mt-4">

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

<div class="order-2 relative">

${about_image_url ? `<img alt="${homepageCopy.misc.photographerPortraitAlt}" class="w-full aspect-[4/5] md:aspect-[3/4] object-cover" src="${about_image_url}"/>` : ''}

<div class="about-image-quote absolute -bottom-8 -left-6 md:-bottom-10 md:-left-10 max-w-[260px] hidden md:block">

<div class="about-image-quote-line"></div>

<p class="about-image-quote-name">— ${photographerName}</p>

</div>

</div>

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section bg-surface-container-low py-xxl" id="galleries">

<div class="homepage-gallery-header px-lg mb-xl homepage-gallery-reveal">

<div class="text-start rtl:text-right">

${classicSectionScript('Collections')}

<h2 class="site-section-title font-headline text-4xl font-bold text-on-surface">${escapeHtml(galleriesSectionTitle)}</h2>

</div>

</div>

<div class="homepage-gallery-grid homepage-gallery-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'classic', siteLanguage)}

</div>

</section>

` : ''}

${galleries.some((g: any) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header">

<div class="hp-posts-header hp-posts-header--with-more hp-posts-header--classic stagger-reveal" data-reveal-delay="0">

<div class="hp-posts-header__titles">

${classicSectionScript('Latest')}

<h2 class="hp-posts-title site-section-title font-headline text-4xl font-bold" style="color:#1c1917;">${escapeHtml(recentPhotosSectionTitle)}</h2>

<div class="hp-posts-divider" style="background:${primaryColor};"></div>

</div>

${portfolioCtaHtml ? `<div class="hp-posts-header__more">${portfolioCtaHtml}</div>` : ''}

</div>

</div>

<div class="recent-photos-grid recent-photos-grid--classic">

${generateRecentPhotosGridHTML(galleries, 'classic')}

</div>

</section>

` : ''}

${postsSectionHtml}

${hasPackages ? `

<section class="homepage-packages-section py-xxl reveal relative overflow-hidden" id="pricing">

${aboutAmbientBackgroundHtml}

<div class="homepage-packages-section__inner contact-section-content relative z-10">

<div class="homepage-packages-section__header stagger-reveal" data-reveal-delay="0">

${classicSectionScript('Packages')}

<h2 class="site-section-title font-headline text-4xl font-bold text-on-surface">${escapeHtml(packagesSectionCopy.title)}</h2>

<div class="homepage-packages-section__divider w-12 h-px bg-outline-variant mt-md"></div>

<p class="font-body-md text-body-md text-on-surface-variant mt-md">${escapeHtml(packagesSectionCopy.subtitle)}</p>

</div>

<div class="homepage-packages-rows">${generatePackagesHTML('classic')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section py-xxl reveal" id="testimonials">

<div class="testimonials-section__inner contact-section-content relative z-10">

<div class="testimonials-section__header stagger-reveal" data-reveal-delay="0">

${classicSectionScript('Recommend')}

<h2 class="site-section-title font-headline text-4xl font-bold text-on-surface">${escapeHtml(testimonialsSectionTitle)}</h2>

<div class="testimonials-section__divider w-12 h-px bg-outline-variant mt-md"></div>

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('classic')}

</div>

</div>

</section>

` : ''}

${generateFaqSectionHTML('classic')}

<section class="${hasContactBg ? 'contact-section-has-bg pt-xxl pb-xl reveal border-t border-outline-variant/10' : 'bg-surface-container-low pt-xxl pb-xl reveal border-t border-outline-variant/10'}" id="contact">

${contactBgLayers('#fdf8f7', '#f7f3f2')}

<div class="max-w-7xl mx-auto px-lg contact-section-content">

<div class="grid grid-cols-1 lg:grid-cols-12 gap-xl md:gap-xxl items-start classic-contact-layout">

<div class="lg:col-span-5 space-y-lg classic-contact-info text-start rtl:text-right">

${classicSectionScript('Contact')}

<h2 class="site-section-title font-headline text-4xl font-bold text-on-surface">${escapeHtml(contactSectionCopy.title)}</h2>

<p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">${escapeHtml(contactSectionCopy.subtitle)}</p>

<div class="classic-contact-details space-y-md pt-lg">

${studioPhone ? `
<a class="classic-contact-details__link flex items-center gap-md flex-row justify-start rtl:justify-start group transition-colors hover:text-primary" href="tel:${studioPhoneHref}">

<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">call</span>

<span class="font-body-md text-body-md shrink-0" dir="ltr">${studioPhoneHtml}</span>

</a>` : ''}

<a class="classic-contact-details__link flex items-center gap-md flex-row justify-start rtl:justify-start group transition-colors hover:text-primary" href="mailto:${email || 'hello@studiogallery.co.il'}">

<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">mail</span>

<span class="font-body-md text-body-md min-w-0 break-all">${email || 'hello@studiogallery.co.il'}</span>

</a>

${studioAddress ? `

<div class="classic-contact-details__item flex items-center gap-md flex-row justify-start rtl:justify-start">

<span class="material-symbols-outlined text-primary shrink-0">location_on</span>

<span class="font-body-md text-body-md">${studioAddressHtml}</span>

</div>` : ''}

</div>

</div>

<div class="lg:col-span-7 min-w-0 classic-contact-form-col">

<form class="classic-contact-form ${hasContactBg ? 'bg-surface/50 backdrop-blur-sm' : 'bg-surface'} p-xl lg:p-xxl rounded-sm shadow-xl border border-outline-variant/20 stagger-item">

<div class="classic-contact-form__row mb-lg">

<div class="classic-contact-field space-y-xs">

<label class="font-label-sm text-label-sm text-on-surface-variant block ${contactAlign}">${homepageCopy.contactForm.fullName}</label>

<input name="name" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-0 ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.nameExample}" required="" type="text"/>

</div>

<div class="classic-contact-field space-y-xs">

<label class="font-label-sm text-label-sm text-on-surface-variant block ${contactAlign}">${homepageCopy.contactForm.phoneContact}</label>

<input name="phone" ${contactLtrDir} class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-0 ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.phone}" type="tel"/>

</div>

</div>

<div class="classic-contact-field space-y-xs mb-lg">

<label class="font-label-sm text-label-sm text-on-surface-variant block ${contactAlign}">${homepageCopy.contactForm.emailAddress}</label>

<input name="email" ${contactLtrDir} class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-0 ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.email}" required="" type="email"/>

</div>

<div class="classic-contact-form__message-block w-full flex flex-col gap-md">

<div class="classic-contact-field space-y-xs">

<label class="font-label-sm text-label-sm text-on-surface-variant block ${contactAlign}">${homepageCopy.contactForm.tellAboutEvent}</label>

<textarea name="message" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 resize-none px-0 ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.messageEvent}" required="" rows="4"></textarea>

</div>

</div>

<div class="contact-privacy-consent w-full flex flex-row items-start gap-sm text-start rtl:text-right">

<input type="checkbox" name="privacy_consent" id="contact_privacy_consent_elegant" required class="contact-privacy-checkbox mt-1 shrink-0 size-4 cursor-pointer rounded border border-current/30" style="accent-color: ${primaryColor};"/>

<p class="text-sm font-light opacity-80 leading-relaxed m-0">

<label for="contact_privacy_consent_elegant" class="cursor-pointer">${homepageCopy.contactForm.privacyBefore}</label> <a href="/privacy" class="underline hover:opacity-80">${homepageCopy.contactForm.privacyLink}</a>.

</p>

</div>

<button class="w-full bg-primary text-on-primary py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-md" type="submit">

                        ${homepageCopy.contactForm.sendInquiry}

<span class="material-symbols-outlined text-sm">send</span>

</button>

</form>

</div>

</div>

</div>

</section>

</main>

${generateSiteFooter(siteChrome('classic'))}

<script>

        ${generateSiteNavScrollScript('classic')}

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

<script>${HOMEPAGE_REVEAL_INIT_SCRIPT}</script>

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
