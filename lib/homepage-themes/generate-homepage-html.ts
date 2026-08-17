import {
  generateHeroSlideshowHTML,
  generateModernHeroFilmBeltHTML,
  wrapHeroWithVideo,
  HERO_SLIDESHOW_CSS,
  HERO_SLIDESHOW_INIT_SCRIPT,
  HERO_VIDEO_INIT_SCRIPT,
  HERO_VIDEO_CSS,
  MODERN_HERO_FILM_BELT_CSS,
  MODERN_HERO_FILM_INIT_SCRIPT,
  normalizeHeroUrlList,
} from '@/lib/hero-slideshow'
import {
  buildPublicSiteChrome,
  generateSiteFooter,
  generateLogoColoringScript,
  generateSiteNav,
  generateSiteNavMobileStyles,
  generateSiteNavScrollScript,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'
import { parseFaqItems, sanitizeFaqItems, type FaqItem } from '@/lib/faq'
import { generateHomepageSectionScrollScript } from '@/lib/photographer-site-paths'
import { resolvePackagesSectionCopy } from '@/lib/packages-section-copy'
import { resolveContactSectionCopy } from '@/lib/contact-section-copy'
import { resolveTestimonialsSectionTitle, resolveTestimonialsSectionSubtitle } from '@/lib/testimonials-section-copy'
import { resolveGalleriesSectionTitle } from '@/lib/galleries-section-copy'
import { resolveRecentPhotosSectionTitle } from '@/lib/recent-photos-section-copy'
import { resolvePostsPageTitle } from '@/lib/posts-section-copy'
import { generateHomepagePostsSectionHTML } from '@/lib/homepage-posts-section'
import {
  HOMEPAGE_STAGGER_REVEAL_CSS,
  HOMEPAGE_STAGGER_REVEAL_SCRIPT,
} from '@/lib/homepage-stagger-reveal'
import { HOMEPAGE_LTR_CSS } from '@/lib/homepage-ltr-css'
import { generateElegantHomepageHTML, type ElegantThemeContext } from '@/lib/homepage-themes/elegant'
import { generateModernHomepageHTML, type ModernThemeContext } from '@/lib/homepage-themes/modern'
import { generateClassicHomepageHTML, type ClassicThemeContext } from '@/lib/homepage-themes/classic'
import { generateDarkHomepageHTML, type DarkThemeContext } from '@/lib/homepage-themes/dark'
import {
  contactLtrDirAttr,
  contactLtrFieldClass,
  contactTextAlignClass,
  getHomepageCopy,
} from '@/lib/homepage-copy'
import {
  contentDirAttr,
  resolveSiteLanguage,
  siteHtmlAttrs,
} from '@/lib/site-language'
import type { PublicBlogPost } from '@/lib/public-blog-html'
import { buildBrandFontVarsStyle, getGoogleFontLinkTag } from '@/lib/fonts'
import { isAllowedFont } from '@/constants/fonts'
import { buildHomepageBlogModalHeadBlock } from '@/lib/public-blog-html'
import type { Photographer, Gallery, Package, Testimonial } from '@/lib/homepage-themes/types'
import {
  UNIFIED_GALLERY_GRID_CSS,
  HOMEPAGE_PACKAGES_GRID_CSS,
  CLASSIC_PACKAGES_ROWS_CSS,
  BOLD_PACKAGES_ROWS_CSS,
  POSTS_PACKAGES_TRANSITION_CSS,
  RECENT_PHOTOS_GRID_CSS,
  CLASSIC_RECENT_PHOTOS_HEADER_CSS,
  MODERN_SECTION_ALIGN_CSS,
  HOMEPAGE_REVEAL_INIT_SCRIPT,
  HOMEPAGE_GALLERY_REVEAL_SCRIPT,
  RECENT_PHOTOS_REVEAL_SCRIPT,
  FAQ_ACCORDION_CSS,
  MODERN_FAQ_ACCORDION_CSS,
  FAQ_SECTION_GLOW_CSS,
  elegantFaqSectionCss,
  classicFaqSectionCss,
  CLASSIC_CONTACT_FORM_CSS,
  TESTIMONIAL_THUMB_CARD_CSS,
  TESTIMONIALS_MARQUEE_INIT_SCRIPT,
  TESTIMONIALS_CAROUSEL_INIT_SCRIPT,
  TESTIMONIALS_EQUAL_HEIGHT_SCRIPT,
} from '@/lib/homepage-themes/shared-styles'
import {
  generateUnifiedGalleryGridHTML,
  generateRecentPhotosGridHTML,
  generatePortfolioCtaHTML,
} from '@/lib/homepage-themes/gallery-html'
import {
  hexToRgb,
  underlineLastWord,
  brandLastWord,
  glassHeroTitle,
  escapeHtml,
  generatePhotographerDocumentHead,
  generateContactPrivacyConsentHTML,
  contactFormSubmitScript,
} from '@/lib/homepage-themes/text-helpers'

export function generateHomepageHTML(

  photographer: Photographer,

  theme: string,

  galleries: Gallery[],

  packages: Package[],

  testimonials: Testimonial[] = [],

  initialSection?: string | null,

  postCount: number = 0,

  blogPath?: string,

  portfolioPath?: string,

  studioPath?: string,

  posts: PublicBlogPost[] = [],

  faviconOrigin?: string,

  photoEditComparisonsCount: number = 0

): string {

  const {

    id: photographerId,

    name,

    studio_name,

    logo_url,

    about_text,

    about_title,

    about_subtitle,

    should_color_logo,

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

    hero_type,

    hero_video_url,

    about_image_url,

    contact_desktop_url,

    contact_mobile_url,

    packages_title,

    packages_subtitle,

    contact_title,

    contact_subtitle,

    testimonials_title,

    galleries_title,

    recent_photos_title,

    email,

    phone,

    address,

  } = photographer



  const siteLanguage = resolveSiteLanguage(photographer.site_language)

  const htmlAttrs = siteHtmlAttrs(siteLanguage)

  const homepageCopy = getHomepageCopy(siteLanguage)

  const contactAlign = contactTextAlignClass(siteLanguage)

  const contactLtrAlign = contactLtrFieldClass(siteLanguage)

  const contactLtrDir = contactLtrDirAttr()

  const contentDir = contentDirAttr(siteLanguage)

  const pkgCenterStyle =
    siteLanguage === 'en'
      ? 'text-align: center !important;'
      : 'direction: rtl !important; text-align: center !important;'

  const pkgListStyle =
    siteLanguage === 'en'
      ? 'text-align: center !important; padding-inline: 0 !important; margin-inline: 0 !important;'
      : 'direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;'

  const pkgListItemStyle =
    siteLanguage === 'en'
      ? 'text-align: center !important;'
      : 'direction: rtl !important; text-align: right !important;'



  const studioAddress = address?.trim() || null

  const studioAddressHtml = studioAddress ? escapeHtml(studioAddress) : ''

  const studioPhone = phone?.trim() || null

  const studioPhoneHtml = studioPhone ? escapeHtml(studioPhone) : ''

  const studioPhoneHref = studioPhone ? studioPhone.replace(/[^\d+]/g, '') : ''

  const contactEmail = email?.trim() || null

  const contactEmailHtml = contactEmail ? escapeHtml(contactEmail) : ''

  const contactDesktopUrl = contact_desktop_url || null

  const contactMobileUrl = contact_mobile_url || null

  const hasContactBg = !!(contactDesktopUrl || contactMobileUrl)



  const sectionBgCss = hasContactBg

    ? `

        .contact-section-has-bg {

            position: relative;

            overflow: hidden;

            width: 100%;

            max-width: none !important;

        }

        .contact-section-bg {

            position: absolute;

            top: 0;

            bottom: 0;

            left: 50%;

            width: 100vw;

            max-width: 100vw;

            margin-left: -50vw;

            z-index: 0;

            height: 100%;

            background-size: cover;

            background-position: center;

            background-repeat: no-repeat;

            pointer-events: none;

        }

        .contact-section-bg-desktop {

            display: none;

            opacity: 0.4;

            filter: brightness(1.45) saturate(0.68) contrast(0.9);

        }

        .contact-section-bg-mobile {

            display: block;

            opacity: 0.22;

            filter: brightness(1.65) saturate(0.62) contrast(0.88);

            -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.06) 52%, transparent 84%);

            mask-image: linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.06) 52%, transparent 84%);

        }

        @media (min-width: 768px) {

            .contact-section-bg-desktop { display: block; }

            .contact-section-bg-mobile { display: none; }

        }

        .contact-section-bg-overlay {

            position: absolute;

            top: 0;

            bottom: 0;

            left: 50%;

            width: 100vw;

            max-width: 100vw;

            margin-left: -50vw;

            z-index: 0;

            height: 100%;

            pointer-events: none;

        }

        @media (max-width: 767px) {

            .contact-section-bg-overlay {

                background: linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--contact-fade, #FAFAF8) 55%, transparent) 62%, var(--contact-fade, #FAFAF8) 94%);

            }

        }

        @media (min-width: 768px) {

            .contact-section-bg-overlay {

                background: linear-gradient(to bottom, color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fff)) 58%, transparent), color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fff)) 96%, transparent));

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



  const primaryColor = accent_color || '#B8953F'

  const primaryColorRgb = hexToRgb(primaryColor)

  const aboutHollowTitleAmbientShadow = `0 4px 12px rgba(${primaryColorRgb}, 0.25)`

  const elegantPackagesGlowHtml = `<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70" aria-hidden="true"></div>`

  const faqAmbientGlowHtml = `<div class="faq-section-glow faq-section-glow--left" style="background:radial-gradient(circle, rgba(${primaryColorRgb}, 0.3) 0%, rgba(${primaryColorRgb}, 0.16) 36%, rgba(${primaryColorRgb}, 0.06) 62%, transparent 84%);" aria-hidden="true"></div><div class="faq-section-glow faq-section-glow--right" style="background:radial-gradient(circle, rgba(${primaryColorRgb}, 0.18) 0%, rgba(${primaryColorRgb}, 0.08) 38%, rgba(${primaryColorRgb}, 0.03) 64%, transparent 86%);" aria-hidden="true"></div>`

  const aboutAmbientBackgroundHtml =

    theme === 'elegant'

      ? elegantPackagesGlowHtml

      : theme === 'classic' || theme === 'dark'

        ? `<div class="about-glow about-glow-left" style="background: radial-gradient(circle, ${primaryColor}70 0%, ${primaryColor}45 24%, ${primaryColor}22 46%, transparent 72%);" aria-hidden="true"></div>

<div class="about-glow about-glow-right" style="background: radial-gradient(circle, ${primaryColor}80 0%, ${primaryColor}50 26%, ${primaryColor}28 48%, transparent 74%);" aria-hidden="true"></div>`

        : ''

  const isPortfolioMode = (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'

  const heroGalleryAnchor = isPortfolioMode
    ? '#recent-photos'
    : theme === 'modern'
      ? '#portfolio'
      : theme === 'classic'
        ? '#galleries'
        : '#gallery'

  const portfolioCtaHtml =

    isPortfolioMode &&

    portfolioPath &&

    galleries.some((g) => (g.photo_pool?.length ?? 0) > 0)

      ? generatePortfolioCtaHTML(

          portfolioPath,

          primaryColor,

          siteLanguage,

        )

      : ''

  const desktopHeroImages = normalizeHeroUrlList(hero_desktop_urls, hero_desktop_url)

  const mobileHeroImages = normalizeHeroUrlList(

    hero_mobile_urls,

    hero_mobile_url,

    desktopHeroImages[0] ?? null

  )

  const activeHeroVideoUrl =
    hero_type === 'video' &&
    hero_video_url &&
    (desktopHeroImages[0] || mobileHeroImages[0])
      ? hero_video_url
      : null
  const heroVideoCss = activeHeroVideoUrl ? HERO_VIDEO_CSS : ''
  const heroVideoScriptHtml = activeHeroVideoUrl
    ? `<script>${HERO_VIDEO_INIT_SCRIPT}</script>`
    : ''

  const heroSlideshowHtml = wrapHeroWithVideo({
    videoUrl: activeHeroVideoUrl,
    fallbackHtml: generateHeroSlideshowHTML({

      desktopImages: desktopHeroImages,

      mobileImages: mobileHeroImages,

      alt: studio_name || homepageCopy.misc.photographyAlt,

    }),
  })

  const heroSlideshowModernHtml = wrapHeroWithVideo({
    videoUrl: activeHeroVideoUrl,
    fallbackHtml: generateModernHeroFilmBeltHTML({

      desktopImages: desktopHeroImages,

      mobileImages: mobileHeroImages,

      alt: studio_name || homepageCopy.misc.photographyAlt,

      heroId: 'hero-slideshow-modern',

    }),
  })

  const heroSlideshowBoldHtml = wrapHeroWithVideo({
    videoUrl: activeHeroVideoUrl,
    fallbackHtml: generateHeroSlideshowHTML({

      desktopImages: desktopHeroImages,

      mobileImages: mobileHeroImages,

      alt: studio_name || homepageCopy.misc.photographyAlt,

      heroId: 'hero-slideshow-bold',

      imgClass: 'bold-hero-image',

    }),
  })

  const aboutImageHtml = about_image_url

    ? `<img alt="${homepageCopy.misc.portraitAlt}" class="w-full h-full object-cover" src="${about_image_url}"/>`

    : ''



  const studioName = studio_name || name || 'סטודיו גלריה'

  const blogModalHeadBlock =
    posts.length > 0 ? buildHomepageBlogModalHeadBlock(primaryColor) : ''

  const brandHeadingFont = isAllowedFont(photographer.heading_font)
    ? photographer.heading_font
    : null
  const brandAboutFont = isAllowedFont(photographer.about_title_font)
    ? photographer.about_title_font
    : null
  const brandFontLink = getGoogleFontLinkTag(brandHeadingFont, brandAboutFont)
  const brandFontVarsStyle = buildBrandFontVarsStyle(brandHeadingFont, brandAboutFont)

  const documentHead =
    generatePhotographerDocumentHead(
      studioName,
      logo_url,
      faviconOrigin,
      photographerId
    ) +
    blogModalHeadBlock +
    (brandFontLink ? `\n${brandFontLink}` : '')

  const photographerName = name || 'אפרת כהן'

  const validFaqItems = sanitizeFaqItems(parseFaqItems(photographer.faq_items))

  const faqSectionImageUrl = photographer.faq_section_image_url?.trim() || null

  const faqSectionWithImageClass = faqSectionImageUrl ? ' faq-section--with-image' : ''

  const faqSectionWithImageStyle = faqSectionImageUrl

    ? ` style="--faq-section-bg-image: url('${faqSectionImageUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')"`

    : ''

  const hasFaq = validFaqItems.length > 0

  const sectionScrollScript = generateHomepageSectionScrollScript(initialSection)



  const resolvedStudioPath = studioPath ?? blogPath?.replace(/\/blog$/, '') ?? '/'
  const resolvedBlogPath = blogPath ?? `${resolvedStudioPath}/blog`
  const resolvedBeforeAfterPath = `${resolvedStudioPath}/before-after`
  const hasPhotoEditComparisons = photoEditComparisonsCount > 0

  const siteChrome = (themeKey: SiteChromeTheme) =>

    buildPublicSiteChrome({

      theme: themeKey,

      studioName,

      logoUrl: logo_url,

      primaryColor,

      homepagePath: resolvedStudioPath,

      linkMode: 'scroll',

      shouldColorLogo: photographer.should_color_logo ?? false,

      hasFaq,

      hasPackages: packages.length > 0,

      hasBlog: postCount > 0,

      blogPath: postCount > 0 ? resolvedBlogPath : undefined,

      hasPhotoEditComparisons,

      beforeAfterPath: hasPhotoEditComparisons ? resolvedBeforeAfterPath : undefined,

      galleryLayoutMode:
        (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'
          ? 'portfolio'
          : 'separated',

      portfolioPath:
        (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'
          ? portfolioPath
          : undefined,

      siteLanguage: photographer.site_language,

    })

  const postsSectionHtml = generateHomepagePostsSectionHTML({
    posts,
    theme: theme as SiteChromeTheme,
    primaryColor,
    sectionTitle: resolvePostsPageTitle(theme, photographer.posts_page_title, siteLanguage),
    blogHref: blogPath ?? '#',
    studioPath: studioPath ?? blogPath?.replace(/\/blog$/, '') ?? '/',
    showAllLink: postCount > 0,
    language: siteLanguage,
    displayStyle: photographer.posts_display_style,
  })

  const aboutText = about_text || ''
  const aboutTextHtml = escapeHtml(aboutText.trim())

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

  const packagesSectionCopy = resolvePackagesSectionCopy(theme, packages_title, packages_subtitle, siteLanguage)

  const contactSectionCopy = resolveContactSectionCopy(theme, contact_title, contact_subtitle, siteLanguage)

  const packagesGridClass =

    packages.length === 1

      ? 'homepage-packages-grid homepage-packages-grid--count-1'

      : packages.length === 2

        ? 'homepage-packages-grid homepage-packages-grid--count-2'

        : 'homepage-packages-grid'

  
  // Sort packages: if there are exactly 3 packages and one is featured, place it in the middle
  const sortedPackages = (() => {
    if (packages.length === 3) {
      const featuredIndex = packages.findIndex(pkg => pkg.is_featured)
      if (featuredIndex !== -1) {
        // Create a copy and move featured package to middle position (index 1)
        const packagesCopy = [...packages]
        const [featured] = packagesCopy.splice(featuredIndex, 1)
        packagesCopy.splice(1, 0, featured)
        return packagesCopy
      }
    }
    return packages
  })()
  
  const hasTestimonials = testimonials.length > 0

  const testimonialsSectionTitle = resolveTestimonialsSectionTitle(

    theme,

    testimonials_title,

    siteLanguage

  )

  const testimonialsSectionSubtitle = resolveTestimonialsSectionSubtitle(theme, siteLanguage)

  const galleriesSectionTitle = resolveGalleriesSectionTitle(
    theme,
    galleries_title,
    siteLanguage,
  )

  const recentPhotosSectionTitle = resolveRecentPhotosSectionTitle(
    theme,
    recent_photos_title,
    siteLanguage,
  )

  const formatStat = (value: number) => (value > 0 ? `${value}+` : `${value}`)



  // Generate dynamic packages HTML for each theme

  const packageCardBg = (solidClass: string) => solidClass



  const generatePackagesHTML = (currentTheme: string) => {

    if (packages.length === 0) return ''

    const packageList = currentTheme === 'classic' || currentTheme === 'dark' ? packages : sortedPackages

    

    return packageList.map((pkg, i) => {

      const includesList = pkg.includes || [];

      const isFeatured = pkg.is_featured;

      

      if (currentTheme === 'elegant') {

        return `

        <div class="stagger-reveal homepage-package-reveal" data-reveal-delay="${i * 100}">

        <div class="${isFeatured ? `${packageCardBg('bg-white')} border-2` : `${packageCardBg('bg-white')} border border-outline-variant`} p-10 flex flex-col h-full relative" style="${pkgCenterStyle} ${isFeatured ? `border-color: ${primaryColor};` : ''}">

          ${isFeatured ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-lg" style="${pkgCenterStyle} background-color: ${primaryColor};">${homepageCopy.packages.bestSeller}</div>` : ''}

          <div class="text-center mb-8 ${isFeatured ? 'mt-2' : ''}" style="${pkgCenterStyle}">

            <h3 class="font-display text-3xl mb-2" style="${pkgCenterStyle} color: ${primaryColor};">${pkg.name}</h3>

            <div class="text-lg tracking-widest elegant-accent" style="${pkgCenterStyle} color: ${isFeatured ? primaryColor : 'inherit'};">₪${pkg.price_amount}</div>

          </div>

          <div class="border-t pt-8 mb-10 flex-grow" style="${pkgCenterStyle} ${isFeatured ? `border-color: ${primaryColor}20;` : 'border-color: rgba(15, 15, 13, 0.1);'}">

            <div class="mx-auto w-fit">

              <ul class="space-y-4 font-body text-base ${isFeatured ? 'text-on-surface-variant' : 'opacity-80'}" style="${pkgListStyle}">

                ${includesList.map((item: string) => `<li style="${pkgListItemStyle}" class="flex flex-row items-center justify-start gap-4 w-full"><span class="material-symbols-outlined text-xl" style="color: ${primaryColor};">check</span> <span>${item}</span></li>`).join('')}

              </ul>

            </div>

          </div>

          <div class="mt-auto" style="${pkgCenterStyle}">

            <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full border border-[#0F0F0D] px-8 py-4 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all" style="${pkgCenterStyle}">${homepageCopy.packages.scheduleConsultation}</button>

          </div>

        </div>

        </div>

      `;

      } else if (currentTheme === 'modern') {

        return `

        <div class="stagger-reveal homepage-package-reveal" data-reveal-delay="${i * 100}">

        <div class="${packageCardBg('bg-white')} p-xl rounded-2xl modern-shadow border border-outline-variant flex flex-col gap-md transition-all hover:-translate-y-2 ${isFeatured ? 'border-2 border-primary' : ''}" style="${pkgCenterStyle}">

          ${isFeatured ? `<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-lg py-1 rounded-full text-xs font-bold uppercase tracking-wider" style="${pkgCenterStyle}">${homepageCopy.packages.bestSeller}</div>` : ''}

          <div style="${pkgCenterStyle}">

            <h3 class="font-headline text-2xl font-bold text-primary" style="${pkgCenterStyle}">${pkg.name}</h3>

            <div class="flex items-baseline gap-xs mt-sm justify-center" style="${pkgCenterStyle}">

              <span class="font-headline text-3xl font-bold text-primary">₪${pkg.price_amount}</span>

            </div>

          </div>

          <div class="mx-auto w-fit flex-grow my-lg">

            <ul class="flex flex-col gap-md" style="${pkgListStyle}">

              ${includesList.map((item: string) => `<li style="${pkgListItemStyle}" class="flex flex-row items-center justify-start gap-sm text-md"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> <span>${item}</span></li>`).join('')}

            </ul>

          </div>

          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full py-md ${isFeatured ? 'bg-primary text-white rounded-lg font-bold btn-magnetic shadow-lg shadow-indigo-100' : 'border border-primary text-primary rounded-lg font-bold btn-magnetic hover:bg-primary/5'} transition-all" style="${pkgCenterStyle}">

            ${homepageCopy.packages.orderNow}

          </button>

        </div>

        </div>

      `;

      } else if (currentTheme === 'classic' || currentTheme === 'dark') {

        const subtitle = pkg.duration_text || (isFeatured ? homepageCopy.packages.fullExperience : homepageCopy.packages.smallMoments)

        return `

        <div class="homepage-packages-row stagger-reveal${isFeatured ? ' homepage-packages-row--featured' : ''}" data-reveal-delay="${i * 100}" style="--primary-color: ${primaryColor};">

          <div class="homepage-packages-row__title">

            ${isFeatured ? `<span class="homepage-packages-row__badge">${homepageCopy.packages.bestSeller}</span>` : ''}

            <h3 class="font-headline-sm text-headline-sm text-primary mb-xs">${pkg.name}</h3>

            <p class="font-body-md text-body-md text-on-surface-variant/60">${subtitle}</p>

          </div>

          <div class="homepage-packages-row__features" ${contentDir}>

            <ul class="homepage-packages-row__features-grid">

              ${includesList.map((item: string) => `<li><span class="material-symbols-outlined">${isFeatured ? 'check_circle' : 'check'}</span><span>${item}</span></li>`).join('')}

            </ul>

          </div>

          <div class="homepage-packages-row__action">

            <div class="homepage-packages-row__price"><span class="homepage-packages-row__price-currency">₪</span>${pkg.price_amount}</div>

            <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="homepage-packages-row__btn ${isFeatured ? 'homepage-packages-row__btn--featured' : 'homepage-packages-row__btn--default'}">

              ${isFeatured ? homepageCopy.packages.selectPackage : homepageCopy.packages.orderPackage}

            </button>

          </div>

        </div>

      `;

      }

      return '';

    }).join('');

  };



  const elegantSectionHeading = (

    title: string,

    watermark: string,

    opts?: { center?: boolean; onDark?: boolean; titleClass?: string; wrapperClass?: string }

  ) => {

    const center = opts?.center ?? false

    const onDark = opts?.onDark ?? false

    const titleClass = opts?.titleClass ?? ''

    const wrapperClass = opts?.wrapperClass ?? ''

    const classes = [

      'elegant-section-heading',

      center ? 'elegant-section-heading--center' : '',

      onDark ? 'elegant-section-heading--on-dark' : '',

      wrapperClass,

    ]

      .filter(Boolean)

      .join(' ')

    return `

      <div class="${classes}">

        <span class="elegant-section-heading__watermark" aria-hidden="true">${escapeHtml(watermark)}</span>

        <h2 class="elegant-section-heading__title site-section-title text-4xl font-bold${titleClass ? ` ${titleClass}` : ''}">${escapeHtml(title)}</h2>

      </div>

    `

  }

  /** Modern: English label above Hebrew title (left-aligned), same type style as current modern headings. */
  const modernSectionHeading = (

    title: string,

    eyebrow: string,

    opts?: { titleClass?: string; onDark?: boolean }

  ) => {

    const titleClass =

      opts?.titleClass ??

      'site-section-title font-headline text-4xl font-bold text-on-surface'

    const eyebrowClass = opts?.onDark

      ? 'modern-section-eyebrow modern-section-eyebrow--on-dark'

      : 'modern-section-eyebrow'

    return `

<div class="modern-section-heading">

<span class="${eyebrowClass}" aria-hidden="true">${escapeHtml(eyebrow)}</span>

<h2 class="${titleClass}">${escapeHtml(title)}</h2>

</div>

`

  }

  /** Classic: script English label above section titles (same words as Elegant watermarks). */
  const classicSectionScript = (label: string) =>
    `<span class="classic-section-script" style="color:${primaryColor};" aria-hidden="true">${escapeHtml(label)}</span>`

  /** Bold/dark: English label above section titles (same words as Elegant). */
  const boldSectionEyebrow = (label: string, opts?: { align?: 'left' | 'center' | 'right' }) => {
    const align = opts?.align ?? 'left'
    const wrapClass =
      align === 'center'
        ? 'bold-section-eyebrow-wrap bold-section-eyebrow-wrap--center'
        : align === 'right'
          ? 'bold-section-eyebrow-wrap bold-section-eyebrow-wrap--right'
          : 'bold-section-eyebrow-wrap'
    return `<div class="${wrapClass}"><span class="bold-section-eyebrow" aria-hidden="true">${escapeHtml(label)}</span></div>`
  }



  const generateFaqAccordionHTML = (currentTheme: string) => {

    if (currentTheme === 'modern' || currentTheme === 'dark') {

      const renderModernItem = (item: FaqItem) =>

        `<details class="faq-item faq-item--modern">

<summary class="faq-item__summary">

<span class="faq-item__question">${escapeHtml(item.question)}</span>

<span class="faq-item__toggle" aria-hidden="true"></span>

</summary>

<div class="faq-answer">${escapeHtml(item.answer)}</div>

</details>`

      const rightColumnItems = validFaqItems.filter((_, index) => index % 2 === 0)

      const leftColumnItems = validFaqItems.filter((_, index) => index % 2 === 1)

      return `<div class="faq-accordion faq-accordion--modern">

<div class="faq-accordion__column faq-accordion__column--start">

${rightColumnItems.map(renderModernItem).join('')}

</div>

<div class="faq-accordion__column faq-accordion__column--end">

${leftColumnItems.map(renderModernItem).join('')}

</div>

</div>`

    }

    return validFaqItems

      .map((item) => {

        const darkClass = currentTheme === 'dark' ? ' faq-item--dark' : ''

        return `<details class="faq-item${darkClass}">

<summary>${escapeHtml(item.question)}</summary>

<div class="faq-answer">${escapeHtml(item.answer)}</div>

</details>`

      })

      .join('')

  }



  const generateMagazineFaqItemsHTML = (variant: 'elegant' | 'classic', includeFeatured = true) =>

    validFaqItems

      .map((item, index) => {

        const revealClass = variant === 'elegant' ? 'reveal-on-scroll' : 'reveal'

        const featuredClass = includeFeatured && index === 0 ? ' faq-magazine-item--featured' : ''

        const indexLabel = String(index + 1).padStart(2, '0')



        return `<article class="faq-magazine-item${featuredClass} ${revealClass}" style="transition-delay: ${index * 80}ms">

<div class="faq-magazine-item__heading">

<span class="faq-magazine-item__number" aria-hidden="true">${indexLabel}</span>

<h3 class="faq-magazine-item__question">${escapeHtml(item.question)}</h3>

</div>

<p class="faq-magazine-item__answer">${escapeHtml(item.answer)}</p>

</article>`

      })

      .join('')



  const generateMagazineFaqBodyHTML = (variant: 'elegant' | 'classic') => {

    const revealClass = variant === 'elegant' ? 'reveal-on-scroll' : 'reveal'

    const withImage = Boolean(faqSectionImageUrl)

    const itemsHtml = generateMagazineFaqItemsHTML(variant, !withImage)



    if (!withImage) {

      return `<div class="faq-magazine-grid">${itemsHtml}</div>`

    }



    return `<div class="faq-magazine-layout faq-magazine-layout--with-image">

<div class="faq-magazine-content">

<div class="faq-magazine-grid faq-magazine-grid--stacked">${itemsHtml}</div>

</div>

<div class="faq-magazine-feature ${revealClass}">

<img src="${faqSectionImageUrl}" alt="" class="faq-magazine-feature__image" loading="lazy" decoding="async"/>

</div>

</div>`

  }



  const generateContactDetailsHTML = (variant: 'elegant' | 'bold') => {

    const prefix = variant === 'elegant' ? 'elegant' : 'bold'

    const revealClass = variant === 'elegant' ? 'reveal-on-scroll' : 'reveal'

    const linkHoverClass =

      variant === 'elegant'

        ? 'hover:text-white transition-colors'

        : 'hover:text-primary transition-colors'

    const items: string[] = []



    if (studioPhone) {

      items.push(`<div class="${prefix}-contact-details__item">

<span class="material-symbols-outlined ${prefix}-contact-details__icon">call</span>

<span class="${prefix}-contact-details__label">${homepageCopy.contactDetails.phone}</span>

<a href="tel:${studioPhoneHref}" class="${prefix}-contact-details__value ${linkHoverClass}" dir="ltr">${studioPhoneHtml}</a>

</div>`)

    }



    if (contactEmail) {

      items.push(`<div class="${prefix}-contact-details__item">

<span class="material-symbols-outlined ${prefix}-contact-details__icon">mail</span>

<span class="${prefix}-contact-details__label">${homepageCopy.contactDetails.email}</span>

<a href="mailto:${contactEmailHtml}" class="${prefix}-contact-details__value ${linkHoverClass}">${contactEmailHtml}</a>

</div>`)

    }



    if (studioAddress) {

      items.push(`<div class="${prefix}-contact-details__item">

<span class="material-symbols-outlined ${prefix}-contact-details__icon">location_on</span>

<span class="${prefix}-contact-details__label">${homepageCopy.contactDetails.location}</span>

<span class="${prefix}-contact-details__value">${studioAddressHtml}</span>

</div>`)

    }



    if (items.length === 0) return ''



    return `<div class="${prefix}-contact-details mt-16 mx-auto max-w-3xl px-8 py-10 md:px-12 ${revealClass}">

<div class="flex flex-wrap justify-center gap-10 md:gap-16">${items.join('')}</div>

</div>`

  }



  const generateElegantContactDetailsHTML = () => generateContactDetailsHTML('elegant')

  const generateBoldContactDetailsHTML = () => generateContactDetailsHTML('bold')



  const generateFaqSectionHTML = (currentTheme: string) => {

    if (!hasFaq) return ''



    const accordion = `<div class="faq-accordion">${generateFaqAccordionHTML(currentTheme)}</div>`



    if (currentTheme === 'elegant') {

      return `<section class="faq-section pt-8 pb-16 md:pt-12 md:pb-32 reveal-on-scroll${faqSectionWithImageClass}" id="faq"${faqSectionWithImageStyle}>

<div class="faq-section__header reveal-on-scroll">

${elegantSectionHeading(homepageCopy.sections.faq, 'FAQ')}

<p class="font-body opacity-60 italic faq-section__subtitle">${homepageCopy.sections.faqSubtitle}</p>

</div>

<div class="faq-magazine-wrap">

${generateMagazineFaqBodyHTML('elegant')}

</div>

</section>`

    }



    if (currentTheme === 'modern') {

      return `<section class="faq-section pt-lg pb-xxl w-full reveal-on-scroll relative" id="faq">

${faqAmbientGlowHtml}

<div class="max-w-7xl mx-auto px-lg relative z-10">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

${modernSectionHeading(homepageCopy.sections.faq, 'FAQ', { titleClass: 'site-section-title font-headline text-4xl font-bold text-on-surface mb-sm' })}

</div>

${generateFaqAccordionHTML('modern')}

</div>

</section>`

    }



    if (currentTheme === 'dark') {

      return `<section class="faq-section pt-lg pb-xxl w-full reveal relative" id="faq">

${faqAmbientGlowHtml}

<div class="max-w-7xl mx-auto px-lg relative z-10">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

${boldSectionEyebrow('FAQ', { align: 'center' })}

<h2 class="site-section-title font-headline text-4xl font-bold text-on-surface mb-sm">${homepageCopy.sections.faq}</h2>

</div>

${generateFaqAccordionHTML('dark')}

</div>

</section>`

    }



    if (currentTheme === 'classic') {

      return `<section class="faq-section py-xxl reveal${faqSectionWithImageClass}" id="faq"${faqSectionWithImageStyle}>

<div class="faq-section__header stagger-reveal" data-reveal-delay="0">

${classicSectionScript('FAQ')}

<h2 class="site-section-title font-headline text-4xl font-bold text-on-surface">${homepageCopy.sections.faq}</h2>

<div class="faq-section__divider w-12 h-px bg-outline-variant mt-md"></div>

<p class="font-body-md text-body-md text-on-surface-variant mt-md faq-section__subtitle">${homepageCopy.sections.faqSubtitle}</p>

</div>

<div class="faq-magazine-wrap">

${generateMagazineFaqBodyHTML('classic')}

</div>

</section>`

    }



    return `<section class="faq-section py-xl md:py-xxl container mx-auto px-lg reveal" id="faq">

<div class="text-center mb-xl md:mb-xxl">

<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">FAQ</span>

<h2 class="site-section-title font-headline text-4xl font-bold">${homepageCopy.sections.faq}</h2>

<p class="font-body-md text-on-surface-variant opacity-70 mt-md">${homepageCopy.sections.faqSubtitle}</p>

</div>

${accordion}

</section>`

  }



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

    options?: { delayAttr?: string; extraClass?: string; forMarquee?: boolean }

  ) => {

    const title = escapeHtml(t.title)

    const content = escapeHtml(t.content)

    const meta = testimonialMeta(t)

    const thumbSrc = testimonialThumbSrc(t)

    const forMarquee = options?.forMarquee ?? false

    const delayAttr = forMarquee ? '' : (options?.delayAttr ?? '')

    const extraClass = forMarquee ? '' : (options?.extraClass ?? '')



    const thumbHtml = thumbSrc

      ? `<div class="testimonial-thumb-card__thumb"><img src="${thumbSrc}" alt="" loading="lazy"/></div>`

      : ''



    const quoteHtml = `<span class="testimonial-thumb-card__quote material-symbols-outlined" style="color: ${primaryColor};">format_quote</span>`



    if (variant === 'classic' || variant === 'modern' || variant === 'dark') {

      const themeModifier =
        variant === 'classic'
          ? 'testimonial-thumb-card--classic'
          : variant === 'modern'
            ? 'testimonial-thumb-card--modern'
            : 'testimonial-thumb-card--dark'

      return `

        <div class="testimonial-thumb-card testimonial-thumb-card--classic classic-testimonial-card ${themeModifier} italic${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>

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

        <div class="testimonial-thumb-card testimonial-thumb-card--elegant flex flex-col justify-between${forMarquee ? '' : ' reveal-on-scroll'}${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>

          ${quoteHtml}

          ${thumbHtml}

          <div class="testimonial-thumb-card__content">

            <div>

              <div class="flex flex-row rtl:flex-row-reverse gap-1 text-accent mb-6">

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

    return ''

  }



  function generateThemeTestimonialCard(
    t: Testimonial,
    theme: 'classic' | 'elegant' | 'modern' | 'dark',
    index: number,
    options?: { forMarquee?: boolean }
  ) {
    if (options?.forMarquee) {
      return generateTestimonialThumbCard(t, theme, { forMarquee: true })
    }
    if (theme === 'elegant') {
      const delay = index > 0 ? ` style="transition-delay: ${index * 150}ms;"` : ''
      return generateTestimonialThumbCard(t, 'elegant', { delayAttr: delay })
    }
    if (theme === 'modern') {
      const delayClass = index > 0 ? ` delay-${Math.min(index * 100, 300)}` : ''
      return generateTestimonialThumbCard(t, 'modern', { extraClass: delayClass })
    }
    return generateTestimonialThumbCard(t, theme)
  }

  function generateTestimonialsCarouselHTML(theme: 'classic' | 'elegant' | 'modern' | 'dark') {
    const wrapBleed = (inner: string) => `<div class="testimonials-bleed">${inner}</div>`

    if (testimonials.length <= 3) {
      const cardsHtml = testimonials
        .map((t, i) => generateThemeTestimonialCard(t, theme, i))
        .join('')
      return wrapBleed(`
    <div class="testimonials-row">
      ${cardsHtml}
    </div>`)
    }

    const slides: Testimonial[][] = []
    for (let i = 0; i < testimonials.length - 2; i++) {
      slides.push(testimonials.slice(i, i + 3))
    }

    const slidesHtml = slides
      .map(
        (slide) => `
    <div class="classic-testimonials-slide">
      <div class="testimonials-row">
        ${slide.map((t, i) => generateThemeTestimonialCard(t, theme, i)).join('')}
      </div>
    </div>`
      )
      .join('')

    const dotsHtml = `
    <div class="classic-testimonials-dots">
      ${slides
        .map(
          (_, i) =>
            `<button type="button" class="classic-testimonials-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="${homepageCopy.misc.testimonialPage} ${i + 1}"></button>`
        )
        .join('')}
    </div>`

    return wrapBleed(`
    <div class="classic-testimonials-carousel" id="testimonials-carousel">
      <div class="classic-testimonials-track">${slidesHtml}</div>
      ${dotsHtml}
    </div>`)
  }

  function generateTestimonialsSection(theme: 'classic' | 'elegant' | 'modern' | 'dark') {
    if (testimonials.length === 0) return ''

    if (photographer.testimonial_layout_type === 'marquee') {
      const cardsHtml = testimonials
        .map((t, i) => generateThemeTestimonialCard(t, theme, i, { forMarquee: true }))
        .join('')
      return generateTestimonialsMarqueeHTML(cardsHtml)
    }

    return generateTestimonialsCarouselHTML(theme)
  }


  function generateTestimonialsMarqueeHTML(cardsHtml: string) {
    // Two identical, contiguous sets with a uniform gap. The init script measures
    // the pixel distance between them and animates by exactly that amount, so the
    // loop seam is invisible. Track flows LTR (anchored left) to avoid the RTL
    // "empties on scroll" bug; each card keeps RTL text.
    return `
    <div class="testimonials-bleed">
    <div class="testimonials-marquee" data-testimonials-marquee>
      <div class="testimonials-marquee-track">
        <div class="testimonials-marquee-set">${cardsHtml}</div>
        <div class="testimonials-marquee-set" aria-hidden="true">${cardsHtml}</div>
      </div>
    </div>
    </div>`
  }



  // Return the appropriate theme HTML

  const elegantThemeContext: ElegantThemeContext = {
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
  }

  const modernThemeContext: ModernThemeContext = {
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
  }

  const classicThemeContext: ClassicThemeContext = {
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
  }

  const darkThemeContext: DarkThemeContext = {
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
  }

  switch (theme) {

    case 'modern':

      return generateModernHomepageHTML(modernThemeContext)

    case 'classic':

      return generateClassicHomepageHTML(classicThemeContext)

    case 'dark':

      return generateDarkHomepageHTML(darkThemeContext)

    case 'elegant':

    default:

      return generateElegantHomepageHTML(elegantThemeContext)

  }

}

