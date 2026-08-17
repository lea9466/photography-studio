export type ModernThemeContext = {
  htmlAttrs: any
  documentHead: any
  primaryColor: any
  photographer: any
  aboutHollowTitleAmbientShadow: any
  UNIFIED_GALLERY_GRID_CSS: any
  HOMEPAGE_PACKAGES_GRID_CSS: any
  POSTS_PACKAGES_TRANSITION_CSS: any
  RECENT_PHOTOS_GRID_CSS: any
  HOMEPAGE_STAGGER_REVEAL_CSS: any
  TESTIMONIAL_THUMB_CARD_CSS: any
  FAQ_ACCORDION_CSS: any
  MODERN_FAQ_ACCORDION_CSS: any
  FAQ_SECTION_GLOW_CSS: any
  MODERN_HERO_FILM_BELT_CSS: any
  heroVideoCss: any
  sectionBgCss: any
  HOMEPAGE_LTR_CSS: any
  generateSiteNavMobileStyles: any
  MODERN_SECTION_ALIGN_CSS: any
  brandFontVarsStyle: any
  generateSiteNav: any
  siteChrome: any
  aboutTitle: any
  aboutSubtitle: any
  aboutDescription: any
  heroSlideshowModernHtml: any
  homepageCopy: any
  heroGalleryAnchor: any
  hasStats: any
  formatStat: any
  statsProjects: any
  statsClients: any
  statsYears: any
  isPortfolioMode: any
  modernSectionHeading: any
  galleriesSectionTitle: any
  generateUnifiedGalleryGridHTML: any
  galleries: any
  siteLanguage: any
  recentPhotosSectionTitle: any
  portfolioCtaHtml: any
  generateRecentPhotosGridHTML: any
  postsSectionHtml: any
  hasPackages: any
  elegantPackagesGlowHtml: any
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
  studioPhone: any
  studioPhoneHtml: any
  email: any
  studioAddress: any
  studioAddressHtml: any
  contactAlign: any
  contactLtrDir: any
  contactLtrAlign: any
  generateContactPrivacyConsentHTML: any
  generateSiteFooter: any
  generateSiteNavScrollScript: any
  generateLogoColoringScript: any
  MODERN_HERO_FILM_INIT_SCRIPT: any
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

export function generateModernHomepageHTML(ctx: ModernThemeContext): string {
  const {
    htmlAttrs, documentHead, primaryColor, photographer, aboutHollowTitleAmbientShadow,
    UNIFIED_GALLERY_GRID_CSS, HOMEPAGE_PACKAGES_GRID_CSS, POSTS_PACKAGES_TRANSITION_CSS,
    RECENT_PHOTOS_GRID_CSS, HOMEPAGE_STAGGER_REVEAL_CSS, TESTIMONIAL_THUMB_CARD_CSS,
    FAQ_ACCORDION_CSS, MODERN_FAQ_ACCORDION_CSS, FAQ_SECTION_GLOW_CSS, MODERN_HERO_FILM_BELT_CSS,
    heroVideoCss, sectionBgCss, HOMEPAGE_LTR_CSS, generateSiteNavMobileStyles, MODERN_SECTION_ALIGN_CSS,
    brandFontVarsStyle, generateSiteNav, siteChrome, aboutTitle, aboutSubtitle, aboutDescription,
    heroSlideshowModernHtml, homepageCopy, heroGalleryAnchor, hasStats, formatStat, statsProjects,
    statsClients, statsYears, isPortfolioMode, modernSectionHeading, galleriesSectionTitle,
    generateUnifiedGalleryGridHTML, galleries, siteLanguage, recentPhotosSectionTitle, portfolioCtaHtml,
    generateRecentPhotosGridHTML, postsSectionHtml, hasPackages, elegantPackagesGlowHtml,
    packagesSectionCopy, escapeHtml, packagesGridClass, generatePackagesHTML, hasTestimonials,
    testimonialsSectionTitle, generateTestimonialsSection, generateFaqSectionHTML, hasContactBg,
    contactBgLayers, contactSectionCopy, studioPhone, studioPhoneHtml, email, studioAddress,
    studioAddressHtml, contactAlign, contactLtrDir, contactLtrAlign, generateContactPrivacyConsentHTML,
    generateSiteFooter, generateSiteNavScrollScript, generateLogoColoringScript, MODERN_HERO_FILM_INIT_SCRIPT,
    heroVideoScriptHtml, TESTIMONIALS_EQUAL_HEIGHT_SCRIPT, TESTIMONIALS_MARQUEE_INIT_SCRIPT,
    TESTIMONIALS_CAROUSEL_INIT_SCRIPT, HOMEPAGE_GALLERY_REVEAL_SCRIPT, RECENT_PHOTOS_REVEAL_SCRIPT,
    HOMEPAGE_STAGGER_REVEAL_SCRIPT, sectionScrollScript, contactFormSubmitScript, photographerId,
  } = ctx

  return `

<!DOCTYPE html>

<html class="light" ${htmlAttrs} style="scroll-behavior: smooth;">

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700;800&family=Space+Grotesk:wght@300..700&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<style>

        :root {

            --headline-font: 'Space Grotesk', 'Heebo', sans-serif;

            --about-title-font: 'Rubik', 'Heebo', sans-serif;

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

        .modern-section-heading {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.35rem;
            width: 100%;
            text-align: left !important;
            direction: ltr;
        }

        .modern-section-eyebrow {
            display: block;
            width: 100%;
            margin: 0;
            padding: 0;
            text-align: left !important;
            direction: ltr;
            font-family: var(--headline-font), 'Heebo', sans-serif;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: ${primaryColor};
            line-height: 1.2;
        }

        .modern-section-heading h1,
        .modern-section-heading h2 {
            width: 100%;
            margin-inline: 0;
            text-align: left !important;
            direction: rtl;
        }

        .modern-section-subtitle {
            color: ${primaryColor};
            text-align: left !important;
        }

        .modern-section-eyebrow--on-dark {
            color: rgba(255, 255, 255, 0.72);
        }

        /* Override shared RTL right-align for modern section headers */
        .theme-modern .homepage-gallery-header,
        .theme-modern .recent-photos-header {
            text-align: left !important;
        }

        .theme-modern .homepage-gallery-header > div,
        .theme-modern .recent-photos-header > div,
        .theme-modern .recent-photos-header > div:not(.hp-posts-header--classic):has(.portfolio-cta-wrap) {
            align-items: flex-start !important;
            justify-content: space-between !important;
            flex-direction: row !important;
            text-align: left !important;
        }

        .theme-modern .homepage-gallery-header .modern-section-heading,
        .theme-modern .recent-photos-header .modern-section-heading,
        .theme-modern .homepage-gallery-header .text-left,
        .theme-modern .recent-photos-header .text-left,
        .theme-modern .homepage-gallery-header .modern-section-subtitle,
        .theme-modern .recent-photos-header .modern-section-subtitle {
            text-align: left !important;
        }

        .theme-modern .modern-contact-info,
        .theme-modern .modern-contact-info .modern-section-heading,
        .theme-modern .modern-contact-info .modern-section-heading h2,
        .theme-modern .modern-contact-info > p {
            text-align: right !important;
        }

        .theme-modern .modern-contact-info .modern-section-heading {
            align-items: flex-end !important;
        }

        .theme-modern .modern-contact-info .modern-section-eyebrow {
            text-align: right !important;
            direction: ltr !important;
            width: 100%;
        }

        .testimonials-section--modern .testimonials-section__header {
            width: 100%;
            text-align: center !important;
            margin-bottom: 2.5rem;
        }

        .testimonials-section--modern .testimonials-section__header h2 {
            display: block;
            width: 100%;
            max-width: 100%;
            text-align: center !important;
            border-bottom: none;
            padding-bottom: 0;
            box-sizing: border-box;
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

        .modern-stats-section {

            width: 100%;

            max-width: 100%;

            padding-top: 30px;

            padding-bottom: 80px;

        }

        .modern-stats-grid {

            display: grid;

            grid-template-columns: 1fr;

            width: 100%;

            gap: 4px;

            padding-inline: 4px;

            box-sizing: border-box;

        }

        @media (min-width: 768px) {

            .modern-stats-grid {

                grid-template-columns: repeat(3, minmax(0, 1fr));

            }

        }

        .modern-stats-card {

            min-width: 0;

            width: 100%;

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

            color: ${primaryColor};

        }

        .modern-nav.nav-scrolled .modern-nav-link:hover,

        .modern-nav.nav-scrolled .modern-nav-menu-btn:hover {

            opacity: 0.85;

        }

        .modern-nav.nav-scrolled .modern-nav-menu-btn {

            color: #0F172A;

        }

        .modern-nav.nav-scrolled .modern-nav-logo {

            filter: ${photographer.should_color_logo ? 'none' : 'brightness(0) invert(1)'};

        }

        .modern-about-content {

            color: #ffffff;

            text-align: right;

            direction: rtl;

            position: relative;

            align-items: stretch;

        }

        .modern-about-content .modern-section-eyebrow {

            display: block;

            width: 100%;

            text-align: right !important;

            direction: ltr;

        }

        .modern-about-content h1,

        .modern-about-content p {

            display: block;

            width: 100%;

            max-width: 36rem;

            margin-inline: 0 0;

            text-align: right !important;

            direction: rtl;

        }

        .modern-about-content .modern-about-actions {

            display: flex;

            flex-wrap: wrap;

            flex-direction: row;

            direction: rtl;

            justify-content: flex-start;

            align-items: center;

            gap: 1rem;

            width: 100%;

            max-width: 36rem;

        }

        .modern-about-content .modern-about-muted {

            color: rgba(255, 255, 255, 0.82);

        }

        .theme-modern .modern-about-content h1 {

            font-family: var(--about-title-font);

            font-weight: 700;

            letter-spacing: 0.02em;

            color: transparent !important;

            -webkit-text-fill-color: transparent;

            -webkit-text-stroke: 1.5px ${primaryColor};

            paint-order: stroke fill;

            text-shadow: ${aboutHollowTitleAmbientShadow};

        }

        .theme-modern .modern-about-content h1 .text-primary {

            color: transparent !important;

            -webkit-text-fill-color: transparent;

        }

        .modern-homepage-gallery-section {

            padding-top: clamp(3.5rem, 9vw, 6rem) !important;

            padding-bottom: clamp(2.5rem, 6vw, 4rem) !important;

        }

        .modern-recent-photos-section.recent-photos-section {

            padding-top: calc(clamp(3.5rem, 8vw, 5.5rem) + 50px) !important;

            padding-bottom: clamp(2.5rem, 6vw, 4rem) !important;

        }

        #pricing.contact-section-has-bg .contact-section-bg-desktop {

            opacity: 0.68;

            filter: brightness(1.18) saturate(0.92) contrast(0.96);

            -webkit-mask-image: none;

            mask-image: none;

        }

        #pricing.contact-section-has-bg .contact-section-bg-mobile {

            opacity: 0.52;

            filter: brightness(1.28) saturate(0.88) contrast(0.94);

            -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 58%, rgba(0,0,0,0.12) 100%);

            mask-image: linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 58%, rgba(0,0,0,0.12) 100%);

        }

        #pricing.contact-section-has-bg .contact-section-bg-overlay {

            background: linear-gradient(

                to bottom,

                color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #F8FAFC)) 18%, transparent) 0%,

                color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #F8FAFC)) 42%, transparent) 100%

            ) !important;

        }

        #contact.contact-section-has-bg {

            padding-inline: 0.75rem;

        }

        #contact.contact-section-has-bg .contact-section-bg-overlay {

            background: transparent !important;

        }

        #contact.contact-section-has-bg .contact-section-bg-desktop,

        #contact.contact-section-has-bg .contact-section-bg-mobile {

            opacity: 0.74;

            filter: none;

            -webkit-mask-image: none;

            mask-image: none;

            border-radius: 0;

            left: 0.75rem;

            width: calc(100% - 1.5rem);

            margin-left: 0;

        }

        #contact.contact-section-has-bg .contact-section-content {

            position: relative;

            z-index: 1;

        }

        #contact.contact-section-has-bg .modern-contact-card--has-bg {

            background-color: transparent !important;

            border-radius: 0 !important;

            box-shadow: none;

        }

        #contact.contact-section-has-bg .modern-contact-card h2,

        #contact.contact-section-has-bg .modern-contact-card p,

        #contact.contact-section-has-bg .modern-contact-card .text-white,

        #contact.contact-section-has-bg .modern-contact-info-row {

            text-shadow: 0 1px 10px rgba(15, 23, 42, 0.55);

        }

        @media (min-width: 768px) {

            #contact.contact-section-has-bg {

                padding-inline: 1.5rem;

            }

            #contact.contact-section-has-bg .contact-section-bg-desktop,

            #contact.contact-section-has-bg .contact-section-bg-mobile {

                left: 1.5rem;

                width: calc(100% - 3rem);

            }

            #contact.contact-section-has-bg .contact-section-content {

                max-width: none;

                width: 100%;

                padding-inline: 1.5rem;

            }

            #contact.contact-section-has-bg .modern-contact-card--has-bg {

                padding: 2.5rem 1.5rem;

            }

        }

        @media (max-width: 767px) {

            #pricing.contact-section-has-bg .contact-section-bg-overlay {

                background: linear-gradient(

                    to bottom,

                    transparent 0%,

                    color-mix(in srgb, var(--contact-fade, #F8FAFC) 28%, transparent) 58%,

                    color-mix(in srgb, var(--contact-fade, #F8FAFC) 72%, transparent) 100%

                ) !important;

            }

            #contact.contact-section-has-bg .contact-section-content {

                max-width: none;

                width: 100%;

                padding-inline: 0.75rem;

            }

            #contact.contact-section-has-bg .modern-contact-card--has-bg {

                padding: 1.5rem 0.75rem;

            }

            #contact .modern-contact-card {

                text-align: center;

            }

            #contact .modern-contact-card .modern-contact-info {

                max-width: none;

                width: 100%;

                text-align: center;

            }

            #contact .modern-contact-card .modern-contact-info-row {

                justify-content: center;

            }

            #contact .modern-contact-form {

                width: 100%;

                padding-inline: 0.75rem;

                box-sizing: border-box;

            }

            #contact .modern-contact-form .modern-contact-form-grid {

                grid-template-columns: 1fr !important;

                width: 100%;

            }

            #contact .modern-contact-form input,

            #contact .modern-contact-form textarea,

            #contact .modern-contact-form button {

                width: 100%;

            }

        }

        .modern-contact-card {

            backdrop-filter: none;

            -webkit-backdrop-filter: none;

        }

        .modern-contact-card:not(.modern-contact-card--has-bg) {

            background-color: ${primaryColor};

        }

        .modern-contact-card--has-bg {

            background-color: transparent;

        }

        ${UNIFIED_GALLERY_GRID_CSS}

        ${HOMEPAGE_PACKAGES_GRID_CSS}

        ${POSTS_PACKAGES_TRANSITION_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${MODERN_FAQ_ACCORDION_CSS}

        ${FAQ_SECTION_GLOW_CSS}

        ${MODERN_HERO_FILM_BELT_CSS}

        ${heroVideoCss}

        ${sectionBgCss}

        ${HOMEPAGE_LTR_CSS}

        ${generateSiteNavMobileStyles()}

        ${MODERN_SECTION_ALIGN_CSS}

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

${brandFontVarsStyle}

</head>

<body class="theme-modern bg-background text-on-surface overflow-x-hidden">

${generateSiteNav(siteChrome('modern'))}

<main${aboutTitle || aboutSubtitle || aboutDescription ? '' : ' class="pt-xxl"'}>

${aboutTitle || aboutSubtitle || aboutDescription ? `

<section class="relative min-h-screen w-full overflow-hidden" id="about">

<div class="absolute inset-0 z-0">

${heroSlideshowModernHtml}

</div>

<div class="relative z-10 min-h-screen flex items-center pt-[80px]">

<div class="w-full max-w-7xl mx-auto px-lg py-xxl grid grid-cols-1 md:grid-cols-2 gap-xl items-center min-h-[calc(100vh-80px)]">

<div class="flex flex-col gap-md animate-reveal relative z-10 modern-about-content justify-self-end md:justify-self-start max-w-2xl w-full text-right">

<span class="modern-section-eyebrow mb-4" aria-hidden="true">ABOUT</span>

${aboutTitle ? '<h1 class="about-hollow-title font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">' + aboutTitle + '</h1>' : '<h1 class="about-hollow-title font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">' + homepageCopy.about.modernDefaultTitleLine1 + ' <br/><span class="text-primary">' + homepageCopy.about.modernDefaultTitleLine2 + '</span></h1>'}

${aboutSubtitle ? '<p class="text-lg md:text-xl modern-about-muted leading-relaxed" style="white-space: pre-line">' + aboutSubtitle + '</p>' : ''}

${aboutDescription ? '<p class="text-lg md:text-xl modern-about-muted leading-relaxed" style="white-space: pre-line">' + aboutDescription + '</p>' : ''}

<div class="modern-about-actions pt-md">

<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="bg-primary text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:shadow-xl shadow-indigo-200 transition-all">

                    ${homepageCopy.hero.getStarted}

                </button>

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="border border-white/40 text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:bg-white/10 transition-all">

                    ${homepageCopy.hero.viewGallery}

                </button>

</div>

</div>

<div class="hidden md:block" aria-hidden="true"></div>

</div>

</div>

</section>

` : ''}

${hasStats ? `

<section class="modern-stats-section w-full">

<div class="modern-stats-grid">

<div class="modern-stats-card bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">photo_camera</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsProjects)}</h3>

<p class="text-on-surface-variant font-medium">${homepageCopy.stats.portfolios}</p>

</div>

<div class="modern-stats-card bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-100 hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">groups</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsClients)}</h3>

<p class="text-on-surface-variant font-medium">${homepageCopy.stats.happyClients}</p>

</div>

<div class="modern-stats-card bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-200 hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">military_tech</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsYears)}</h3>

<p class="text-on-surface-variant font-medium">${homepageCopy.stats.yearsExperience}</p>

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section modern-homepage-gallery-section" id="portfolio">

<div class="homepage-gallery-header px-lg mb-xl homepage-gallery-reveal">

<div class="flex flex-row justify-between items-end gap-md">

<div class="text-left w-full">

${modernSectionHeading(galleriesSectionTitle, 'COLLECTIONS', { titleClass: 'site-section-title font-headline text-4xl font-bold mb-xs' })}

</div>

</div>

</div>

<div class="homepage-gallery-grid homepage-gallery-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'modern', siteLanguage)}

</div>

</section>

` : ''}

${galleries.some((g: any) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section modern-recent-photos-section" id="recent-photos">

<div class="recent-photos-header recent-photos-header--modern">

<div class="recent-photos-header__row">

<div class="recent-photos-header__titles">

${modernSectionHeading(recentPhotosSectionTitle, 'LATEST', { titleClass: 'site-section-title font-headline text-4xl font-bold mb-xs' })}

</div>

${portfolioCtaHtml}

</div>

</div>

<div class="recent-photos-grid recent-photos-grid--modern">

${generateRecentPhotosGridHTML(galleries, 'modern')}

</div>

</section>

` : ''}

${postsSectionHtml}

${hasPackages ? `

<section class="py-xxl w-full relative overflow-hidden" id="pricing">

${elegantPackagesGlowHtml}

<div class="max-w-7xl mx-auto px-lg relative z-10">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

${modernSectionHeading(packagesSectionCopy.title, 'PACKAGES')}

<p class="modern-section-subtitle">${escapeHtml(packagesSectionCopy.subtitle)}</p>

</div>

<div class="${packagesGridClass}">${generatePackagesHTML('modern')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section testimonials-section--modern py-xxl reveal" id="testimonials">

<div class="testimonials-section__inner contact-section-content relative z-10">

<div class="testimonials-section__header stagger-reveal" data-reveal-delay="0">

${modernSectionHeading(testimonialsSectionTitle, 'RECOMMEND')}

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('modern')}</div>

</div>

</section>

` : ''}

${generateFaqSectionHTML('modern')}

<section class="w-full ${hasContactBg ? 'contact-section-has-bg py-xxl' : 'max-w-7xl mx-auto px-lg'}" id="contact">

${contactBgLayers('#F8FAFC')}

<div class="contact-section-content">

<div class="modern-contact-card ${hasContactBg ? 'modern-contact-card--has-bg' : 'bg-primary rounded-2xl'} p-xl md:p-xxl text-white animate-reveal">

<div class="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">

<div class="modern-contact-info max-w-md text-right">

${modernSectionHeading(contactSectionCopy.title, 'CONTACT', { titleClass: 'site-section-title font-headline text-4xl font-bold mb-sm text-white', onDark: true })}

<p class="text-lg opacity-90 text-white mb-lg text-right">${escapeHtml(contactSectionCopy.subtitle)}</p>

<div class="flex flex-col gap-md">

${studioPhone ? `
<div class="modern-contact-info-row flex items-center justify-start gap-sm">

<span class="material-symbols-outlined text-white">call</span>

<span class="text-white" dir="ltr">${studioPhoneHtml}</span>

</div>` : ''}

<div class="modern-contact-info-row flex items-center justify-start gap-sm">

<span class="material-symbols-outlined text-white">mail</span>

<span class="text-white">${email || 'hello@studiogallery.co.il'}</span>

</div>

${studioAddress ? `

<div class="modern-contact-info-row flex items-center justify-start gap-sm">

<span class="material-symbols-outlined text-white">location_on</span>

<span class="text-white">${studioAddressHtml}</span>

</div>` : ''}

</div>

</div>

<form class="modern-contact-form flex flex-col gap-md w-full">

<div class="modern-contact-form-grid grid grid-cols-1 sm:grid-cols-2 gap-md">

<div class="relative">

<input name="name" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${contactAlign}" id="contact_name" placeholder="${homepageCopy.contactForm.fullName}" type="text"/>

</div>

<div class="relative">

<input name="email" required ${contactLtrDir} class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${contactLtrAlign}" id="contact_email" placeholder="${homepageCopy.contactForm.placeholders.email}" type="email"/>

</div>

</div>

<div class="relative">

<input name="phone" ${contactLtrDir} class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${contactLtrAlign}" id="contact_phone" placeholder="${homepageCopy.contactForm.placeholders.phone}" type="tel"/>

</div>

<div class="relative">

<textarea name="message" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${contactAlign}" id="contact_message" placeholder="${homepageCopy.contactForm.placeholders.message}" rows="3"></textarea>

</div>

${generateContactPrivacyConsentHTML('modern', primaryColor, homepageCopy)}

<button class="bg-white text-primary px-xl py-md rounded-lg font-bold btn-magnetic hover:shadow-xl w-full transition-all" type="submit">

                        ${homepageCopy.contactForm.submit}

                    </button>

</form>

</div>

</div>

</div>

</section>

</main>

${generateSiteFooter(siteChrome('modern'))}

<script>${generateSiteNavScrollScript('modern')}</script>

<script>${generateLogoColoringScript()}</script>

<script>${MODERN_HERO_FILM_INIT_SCRIPT}</script>

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
