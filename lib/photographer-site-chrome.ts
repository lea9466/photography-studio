import { homepageSectionHref, homepageScrollToTopAction } from '@/lib/photographer-site-paths'

export type SiteChromeTheme = 'elegant' | 'modern' | 'classic' | 'dark'

export type SiteChromeLinkMode = 'scroll' | 'href'

export type SiteChromeConfig = {
  theme: SiteChromeTheme
  studioName: string
  logoUrl: string | null
  primaryColor: string
  homepagePath: string
  linkMode: SiteChromeLinkMode
  hasFaq?: boolean
  hasPackages?: boolean
  shouldColorLogo?: boolean
}

export function brandLastWord(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  const words = trimmed.split(/\s+/)
  if (words.length === 1) {
    return `<span class="text-primary font-light">${trimmed}</span>`
  }
  const lastWord = words.pop()!
  return `${words.join(' ')} <span class="text-primary font-light">${lastWord}</span>`
}

function gallerySectionId(theme: SiteChromeTheme) {
  if (theme === 'modern') return 'portfolio'
  if (theme === 'classic') return 'galleries'
  return 'gallery'
}

const STUDIO_SIGNUP_PATH = '/register'

function generateStudioSignupFooterCta(theme: SiteChromeTheme): string {
  const question = 'אהבתם את הסטודיו?'
  const btn = 'לפתיחת סטודיו משלכם'
  const wrap = 'inline-flex flex-row items-center gap-2 shrink-0'

  switch (theme) {
    case 'elegant':
      return `<div class="${wrap}">
<span class="text-[10px] uppercase tracking-wider opacity-40 text-on-surface whitespace-nowrap">${question}</span>
<a href="${STUDIO_SIGNUP_PATH}" target="_parent" class="text-[10px] uppercase tracking-wider border border-on-surface/15 px-2 py-0.5 text-on-surface/55 hover:border-on-surface/35 hover:text-on-surface transition-colors whitespace-nowrap">${btn}</a>
</div>`
    case 'modern':
      return `<div class="${wrap}">
<span class="text-[11px] text-on-surface-variant/70 whitespace-nowrap">${question}</span>
<a href="${STUDIO_SIGNUP_PATH}" target="_parent" class="text-[11px] font-medium text-primary border border-primary/25 rounded-md px-2 py-0.5 hover:bg-primary/10 transition-colors whitespace-nowrap">${btn}</a>
</div>`
    case 'classic':
      return `<div class="${wrap}">
<span class="text-[11px] text-on-surface-variant whitespace-nowrap">${question}</span>
<a href="${STUDIO_SIGNUP_PATH}" target="_parent" class="text-[11px] border border-primary/30 text-primary rounded-sm px-2 py-0.5 hover:bg-primary/5 transition-colors whitespace-nowrap">${btn}</a>
</div>`
    case 'dark':
      return `<div class="${wrap}">
<span class="text-[10px] uppercase tracking-wider text-on-surface-variant/60 whitespace-nowrap">${question}</span>
<a href="${STUDIO_SIGNUP_PATH}" target="_parent" class="text-[10px] uppercase tracking-wider border border-primary/35 text-primary/90 rounded-sm px-2 py-0.5 hover:bg-primary/10 transition-colors whitespace-nowrap">${btn}</a>
</div>`
  }
}

type NavTarget = 'home' | 'gallery' | 'pricing' | 'faq' | 'contact'

function navSectionId(cfg: SiteChromeConfig, target: NavTarget) {
  if (target === 'gallery') return gallerySectionId(cfg.theme)
  if (target === 'pricing') return 'pricing'
  if (target === 'faq') return 'faq'
  return 'contact'
}

function navHref(cfg: SiteChromeConfig, target: NavTarget) {
  if (target === 'home') return cfg.homepagePath
  const sectionId = navSectionId(cfg, target)
  if (cfg.linkMode === 'href') {
    return homepageSectionHref(cfg.homepagePath, sectionId)
  }
  return `${cfg.homepagePath}#${sectionId}`
}

function parentNavTarget(cfg: SiteChromeConfig) {
  return cfg.linkMode === 'href' ? ' target="_parent"' : ''
}

function navAction(cfg: SiteChromeConfig, target: NavTarget, closeMenu?: string) {
  const close = closeMenu ? `; ${closeMenu}` : ''
  if (cfg.linkMode === 'href') {
    return `href="${navHref(cfg, target)}"`
  }
  if (target === 'home') {
    return homepageScrollToTopAction(closeMenu)
  }
  return `onclick="document.querySelector('#${navSectionId(cfg, target)}').scrollIntoView({behavior: 'smooth'})${close}"`
}

function logoBlock(cfg: SiteChromeConfig, options: { imgClass?: string; textClass: string }) {
  const imgClass = options.imgClass ?? 'h-10 w-auto object-contain'
  if (cfg.logoUrl) {
    if (cfg.shouldColorLogo) {
      return `<img 
        src="${cfg.logoUrl}" 
        alt="${cfg.studioName}" 
        class="${imgClass} brand-logo-colorable" 
        data-brand-color="${cfg.primaryColor}"
        data-logo-url="${cfg.logoUrl}"
      />`
    }
    return `<img src="${cfg.logoUrl}" alt="${cfg.studioName}" class="${imgClass}" />`
  }
  return `<span class="${options.textClass}">${cfg.theme === 'dark' ? brandLastWord(cfg.studioName) : cfg.studioName}</span>`
}

function navItems(
  cfg: SiteChromeConfig,
  className: string,
  closeMenu?: string
) {
  const cursor = cfg.linkMode === 'scroll' ? ' cursor-pointer' : ''
  const cls = `${className}${cursor}`
  const labels: Record<NavTarget, string> = {
    home: 'בית',
    gallery: 'גלריות',
    pricing: 'חבילות צילום',
    faq: 'שאלות נפוצות',
    contact: 'יצירת קשר',
  }
  const targets: NavTarget[] = ['home', 'gallery']
  if (cfg.hasPackages) targets.push('pricing')
  if (cfg.hasFaq) targets.push('faq')
  targets.push('contact')

  return targets
    .map((target) => {
      const action = navAction(cfg, target, closeMenu)
      const closeAttr =
        cfg.linkMode === 'href' && closeMenu ? ` onclick="${closeMenu}"` : ''
      if (cfg.linkMode === 'href') {
        const href = navHref(cfg, target)
        return `<a href="${href}" class="${cls}"${parentNavTarget(cfg)}${closeAttr}>${labels[target]}</a>`
      }
      return `<a ${action} class="${cls}">${labels[target]}</a>`
    })
    .join('\n')
}

function brandLink(cfg: SiteChromeConfig, inner: string) {
  if (cfg.linkMode === 'href') {
    return `<a href="${cfg.homepagePath}" class="flex items-center gap-sm"${parentNavTarget(cfg)}>${inner}</a>`
  }
  return `<div class="flex items-center gap-sm">${inner}</div>`
}

function navInitialClasses(theme: SiteChromeTheme, linkMode: SiteChromeLinkMode): string {
  if (linkMode !== 'href') {
    return 'border-none bg-transparent py-md'
  }

  switch (theme) {
    case 'modern':
      return 'nav-scrolled bg-[#F8FAFC]/95 backdrop-blur-md py-sm border-b border-outline-variant/20 shadow-sm'
    case 'classic':
      return 'nav-scrolled bg-surface/90 backdrop-blur-md py-sm border-b border-outline-variant/20 shadow-sm'
    case 'dark':
      return 'nav-scrolled bg-background/90 backdrop-blur-md py-sm border-b border-white/10 shadow-sm'
    default:
      return 'bg-transparent py-md'
  }
}

export function generateSiteNav(cfg: SiteChromeConfig): string {
  switch (cfg.theme) {
    case 'elegant':
      return `
<nav class="elegant-nav fixed top-0 w-full z-50 bg-transparent transition-all duration-500 left-0 right-0" id="main-nav">
<div class="site-nav-inner flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
${brandLink(cfg, logoBlock(cfg, { imgClass: 'site-nav-logo h-10 w-auto object-contain', textClass: 'font-display text-xl uppercase tracking-[0.2em] font-medium text-on-surface' }))}
<button onclick="toggleMobileMenuElegant()" class="site-nav-menu-btn md:hidden p-2 text-on-surface hover:text-accent transition-colors">
<span class="material-symbols-outlined text-3xl" id="menu-icon-elegant">menu</span>
</button>
<div class="hidden md:flex flex-row gap-xl items-center">
${navItems(cfg, 'text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest')}
</div>
</div>
</nav>
<div id="mobile-menu-elegant" class="site-nav-mobile-menu hidden md:hidden fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#0F0F0D]/10">
<div class="flex flex-col gap-md px-lg py-md">
${navItems(cfg, 'text-on-surface hover:text-accent transition-colors text-lg uppercase tracking-widest py-2', 'toggleMobileMenuElegant()')}
</div>
</div>
<script>
function toggleMobileMenuElegant() {
const menu = document.getElementById('mobile-menu-elegant');
const icon = document.getElementById('menu-icon-elegant');
menu.classList.toggle('hidden');
icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
}
</script>`

    case 'modern':
      return `
<nav class="modern-nav fixed top-0 w-full z-50 transition-all duration-700 ${navInitialClasses('modern', cfg.linkMode)}" id="main-nav">
<div class="site-nav-inner flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
${brandLink(cfg, logoBlock(cfg, { imgClass: 'modern-nav-logo site-nav-logo h-10 w-auto object-contain', textClass: 'modern-nav-brand font-headline text-xl font-bold' }))}
<button onclick="toggleMobileMenu()" class="modern-nav-menu-btn site-nav-menu-btn md:hidden p-2 transition-colors">
<span class="material-symbols-outlined text-3xl" id="menu-icon">menu</span>
</button>
<div class="hidden md:flex flex-row gap-xl items-center">
${navItems(cfg, 'modern-nav-link text-sm font-medium transition-colors')}
</div>
</div>
<div id="mobile-menu" class="site-nav-mobile-menu hidden md:hidden fixed top-16 left-0 right-0 z-40 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-outline-variant/20">
<div class="flex flex-col gap-md px-lg py-md">
${navItems(cfg, 'text-on-surface hover:text-primary transition-colors text-lg font-medium py-2', 'toggleMobileMenu()')}
</div>
</div>
</nav>
<script>
function toggleMobileMenu() {
const menu = document.getElementById('mobile-menu');
const icon = document.getElementById('menu-icon');
menu.classList.toggle('hidden');
icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
}
</script>`

    case 'classic':
      return `
<nav class="classic-nav fixed top-0 w-full z-50 transition-all duration-700 ${navInitialClasses('classic', cfg.linkMode)}" id="main-nav">
<div class="site-nav-inner flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
${brandLink(cfg, logoBlock(cfg, { imgClass: 'classic-nav-logo site-nav-logo h-10 w-auto object-contain', textClass: 'classic-nav-brand font-headline-sm text-headline-sm tracking-tight' }))}
<button onclick="toggleMobileMenuClassic()" class="classic-nav-menu-btn site-nav-menu-btn md:hidden p-2 transition-colors">
<span class="material-symbols-outlined text-3xl" id="menu-icon-classic">menu</span>
</button>
<div class="hidden md:flex flex-row gap-xl items-center">
${navItems(cfg, 'classic-nav-link font-label-sm text-label-sm transition-colors')}
</div>
</div>
<div id="mobile-menu-classic" class="site-nav-mobile-menu hidden md:hidden fixed top-16 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/10">
<div class="flex flex-col gap-md px-lg py-md">
${navItems(cfg, 'text-on-surface hover:text-primary transition-colors text-lg font-label-sm py-2', 'toggleMobileMenuClassic()')}
</div>
</div>
</nav>
<script>
function toggleMobileMenuClassic() {
const menu = document.getElementById('mobile-menu-classic');
const icon = document.getElementById('menu-icon-classic');
menu.classList.toggle('hidden');
icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
}
</script>`

    case 'dark':
      return `
<nav class="bold-nav fixed top-0 w-full z-50 transition-all duration-700 ${navInitialClasses('dark', cfg.linkMode)}" id="main-nav">
<div class="site-nav-inner flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
${brandLink(cfg, logoBlock(cfg, { imgClass: 'bold-nav-logo site-nav-logo h-10 w-auto object-contain', textClass: 'bold-nav-brand font-headline-sm text-headline-sm tracking-tighter' }))}
<button onclick="toggleMobileMenuDark()" class="bold-nav-menu-btn site-nav-menu-btn md:hidden p-2 transition-colors">
<span class="material-symbols-outlined text-3xl" id="menu-icon-dark">menu</span>
</button>
<div class="hidden md:flex flex-row gap-xl items-center">
${navItems(cfg, 'bold-nav-link font-label-sm text-label-sm btn-fuchsia-transition')}
</div>
</div>
<div id="mobile-menu-dark" class="site-nav-mobile-menu hidden md:hidden fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-white/10">
<div class="flex flex-col gap-md px-lg py-md">
${navItems(cfg, 'text-on-surface hover:text-primary transition-colors text-lg font-label-sm btn-fuchsia-transition py-2', 'toggleMobileMenuDark()')}
</div>
</div>
</nav>
<script>
function toggleMobileMenuDark() {
const menu = document.getElementById('mobile-menu-dark');
const icon = document.getElementById('menu-icon-dark');
menu.classList.toggle('hidden');
icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
}
</script>`
  }
}

export function generateSiteFooter(cfg: SiteChromeConfig): string {
  const year = new Date().getFullYear()

  switch (cfg.theme) {
    case 'elegant':
      return `
<footer class="bg-background py-12 px-margin-mobile md:px-margin-desktop border-t border-outline-variant/20 pb-32">
<div class="max-w-7xl mx-auto flex flex-col md:flex-row-reverse justify-between items-center gap-8">
${cfg.logoUrl ? `<img src="${cfg.logoUrl}" alt="${cfg.studioName}" class="h-10 w-auto object-contain" />` : `<div class="font-display text-xl uppercase tracking-widest text-on-surface">${cfg.studioName}</div>`}
<div class="site-footer-legal-links flex flex-row-reverse flex-wrap justify-center gap-8 text-xs uppercase tracking-widest">
<a class="text-on-surface-variant hover:text-accent transition-colors" href="/terms">תקנון</a>
<a class="text-on-surface-variant hover:text-accent transition-colors" href="/privacy">פרטיות</a>
<a class="text-on-surface-variant hover:text-accent transition-colors" href="/accessibility">הצהרת נגישות</a>
</div>
<div class="text-[10px] uppercase tracking-widest text-on-surface-variant">
            © ${year} ${cfg.studioName}. כל הזכויות שמורות.
        </div>
${generateStudioSignupFooterCta('elegant')}
</div>
</footer>`

    case 'modern':
      return `
<footer class="bg-background border-t border-outline-variant/20 w-full py-xl pb-[120px]">
<div class="max-w-7xl mx-auto w-full px-lg">
<div class="flex flex-col md:flex-row-reverse justify-between items-center gap-md w-full">
<div class="flex flex-col items-center md:items-end gap-xs">
${cfg.logoUrl ? `<img src="${cfg.logoUrl}" alt="${cfg.studioName}" class="h-10 w-auto object-contain" />` : `<span class="font-headline text-2xl font-bold text-primary">${cfg.studioName}</span>`}
<p class="text-on-surface-variant text-sm">צילום אמנותי למותגים ואנשים.</p>
</div>
<div class="site-footer-legal-links flex flex-row-reverse flex-wrap justify-center gap-md sm:gap-lg items-center">
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm" href="/terms">תקנון</a>
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm" href="/privacy">פרטיות</a>
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm" href="/accessibility">הצהרת נגישות</a>
</div>
<div class="text-on-surface-variant text-sm text-center">
            © ${year} ${cfg.studioName}. כל הזכויות שמורות.
        </div>
<div class="flex gap-md">
<a aria-label="שיתוף" class="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all btn-magnetic" href="#">
<span class="material-symbols-outlined text-xl">share</span>
</a>
<a aria-label="אימייל" class="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all btn-magnetic" href="#">
<span class="material-symbols-outlined text-xl">mail</span>
</a>
</div>
${generateStudioSignupFooterCta('modern')}
</div>
</div>
</footer>`

    case 'classic':
      return `
<footer class="bg-background border-t border-outline-variant/20 py-xl pb-xxl">
<div class="max-w-7xl mx-auto w-full px-lg">
<div class="flex flex-col md:flex-row-reverse justify-between items-center gap-md w-full">
<div class="font-headline-md text-headline-md text-primary tracking-tight">
                ${cfg.logoUrl ? `<img src="${cfg.logoUrl}" alt="${cfg.studioName}" class="h-10 w-auto object-contain" />` : `${cfg.studioName}`}
            </div>
<div class="site-footer-legal-links flex flex-row-reverse flex-wrap justify-center gap-lg">
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/terms">תקנון</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/privacy">פרטיות</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/accessibility">הצהרת נגישות</a>
</div>
<div class="font-body-md text-body-md text-on-surface/60">
                © ${year} ${cfg.studioName}. כל הזכויות שמורות.
        </div>
${generateStudioSignupFooterCta('classic')}
</div>
</div>
</footer>`

    case 'dark':
      return `
<footer class="bg-background border-t border-outline-variant/20 py-xl">
<div class="max-w-7xl mx-auto w-full px-lg">
<div class="flex flex-col md:flex-row-reverse justify-between items-center gap-lg w-full">
<div class="font-headline-sm text-headline-sm text-on-surface tracking-tighter">
                ${cfg.logoUrl ? `<img src="${cfg.logoUrl}" alt="${cfg.studioName}" class="h-10 w-auto object-contain" />` : `${brandLastWord(cfg.studioName)}`}
</div>
<div class="site-footer-legal-links flex flex-row-reverse flex-wrap justify-center gap-md lg:gap-xl">
<a class="text-on-surface-variant hover:text-primary btn-fuchsia-transition font-label-sm uppercase tracking-widest text-[10px] md:text-xs" href="/terms">תקנון</a>
<a class="text-on-surface-variant hover:text-primary btn-fuchsia-transition font-label-sm uppercase tracking-widest text-[10px] md:text-xs" href="/privacy">פרטיות</a>
<a class="text-on-surface-variant hover:text-primary btn-fuchsia-transition font-label-sm uppercase tracking-widest text-[10px] md:text-xs" href="/accessibility">הצהרת נגישות</a>
</div>
<div class="text-on-surface-variant font-body-md text-[10px] md:text-xs opacity-50">
                © ${year} ${cfg.studioName}. כל הזכויות שמורות.
        </div>
${generateStudioSignupFooterCta('dark')}
</div>
</div>
</footer>`
  }
}

export function generateLogoColoringScript(): string {
  return `
  (function() {
    const colorableLogos = document.querySelectorAll('.brand-logo-colorable');
    colorableLogos.forEach(async (img) => {
      const logoUrl = img.getAttribute('data-logo-url');
      const brandColor = img.getAttribute('data-brand-color');
      if (!logoUrl || !brandColor) return;
      
      const isSvg = logoUrl.toLowerCase().includes('.svg') || logoUrl.includes('image/svg+xml');
      if (!isSvg) return;
      
      try {
        const response = await fetch(logoUrl);
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svg = svgDoc.documentElement;
        
        // Color all SVG elements
        const elements = svg.querySelectorAll('path, circle, rect, ellipse, polygon, polyline, line');
        elements.forEach(el => {
          el.style.fill = brandColor;
          el.style.stroke = brandColor;
        });
        
        // Replace img with colored SVG
        const wrapper = document.createElement('div');
        wrapper.className = img.className;
        wrapper.style.cssText = img.style.cssText;
        wrapper.appendChild(svg);
        svg.style.width = '100%';
        svg.style.height = '100%';
        img.parentNode?.replaceChild(wrapper, img);
      } catch (e) {
        console.warn('Failed to color logo:', e);
      }
    });
  })();`
}

export function generateSiteNavScrollScript(
  theme: SiteChromeTheme,
  linkMode: SiteChromeLinkMode = 'scroll',
): string {
  if (linkMode === 'href') return ''

  switch (theme) {
    case 'elegant':
      return `
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    if (window.scrollY > 100) {
        nav.classList.add('bg-white/80', 'backdrop-blur-lg', 'shadow-sm', 'py-4');
        nav.classList.remove('bg-transparent', 'py-md');
    } else {
        nav.classList.remove('bg-white/80', 'backdrop-blur-lg', 'shadow-sm', 'py-4');
        nav.classList.add('bg-transparent', 'py-md');
    }
});`

    case 'modern':
      return `
window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    if (window.scrollY > 80) {
        nav.classList.add('nav-scrolled', 'bg-[#F8FAFC]/95', 'backdrop-blur-md', 'py-sm', 'border-b', 'border-outline-variant/20', 'shadow-sm');
        nav.classList.remove('py-md', 'border-none', 'bg-transparent');
    } else {
        nav.classList.remove('nav-scrolled', 'bg-[#F8FAFC]/95', 'backdrop-blur-md', 'py-sm', 'border-b', 'border-outline-variant/20', 'shadow-sm');
        nav.classList.add('py-md', 'border-none', 'bg-transparent');
    }
});`

    case 'classic':
      return `
window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    if (window.scrollY > 80) {
        nav.classList.add('nav-scrolled', 'bg-surface/90', 'backdrop-blur-md', 'py-sm', 'border-b', 'border-outline-variant/20', 'shadow-sm');
        nav.classList.remove('py-md', 'border-none', 'bg-transparent');
    } else {
        nav.classList.remove('nav-scrolled', 'bg-surface/90', 'backdrop-blur-md', 'py-sm', 'border-b', 'border-outline-variant/20', 'shadow-sm');
        nav.classList.add('py-md', 'border-none', 'bg-transparent');
    }
});`

    case 'dark':
      return `
window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    if (window.scrollY > 80) {
        nav.classList.add('nav-scrolled', 'bg-background/90', 'backdrop-blur-md', 'py-sm', 'border-b', 'border-white/10', 'shadow-sm');
        nav.classList.remove('py-md', 'border-none', 'bg-transparent');
    } else {
        nav.classList.remove('nav-scrolled', 'bg-background/90', 'backdrop-blur-md', 'py-sm', 'border-b', 'border-white/10', 'shadow-sm');
        nav.classList.add('py-md', 'border-none', 'bg-transparent');
    }
});`
  }
}

export function generateSiteNavMobileStyles(): string {
  return `
        @media (max-width: 767px) {
            .modern-nav,
            .classic-nav,
            .bold-nav,
            .elegant-nav {
                padding-top: 0 !important;
                padding-bottom: 0 !important;
            }
            .site-nav-inner {
                padding-top: 1rem;
                padding-bottom: 1rem;
            }
            .site-nav-logo {
                height: 2.5rem;
                width: auto;
            }
            .site-nav-menu-btn {
                padding: 0.5rem;
            }
            .site-nav-menu-btn .material-symbols-outlined {
                font-size: 1.875rem;
                line-height: 1;
            }
            .site-nav-mobile-menu {
                top: 4rem;
            }
            .site-footer-legal-links {
                display: flex !important;
                flex-direction: row-reverse !important;
                flex-wrap: nowrap !important;
                justify-content: center;
                align-items: center;
                gap: 0.625rem;
            }
            .site-footer-legal-links a {
                white-space: nowrap;
            }
        }`
}

export function generateSiteNavStyles(theme: SiteChromeTheme, primaryColor: string, shouldColorLogo: boolean = false): string {
  if (theme === 'classic') {
    return `
        .classic-nav .classic-nav-brand,
        .classic-nav .classic-nav-link,
        .classic-nav .classic-nav-menu-btn {
            color: #1c1917;
        }
        .classic-nav .classic-nav-link:hover,
        .classic-nav .classic-nav-menu-btn:hover {
            color: ${primaryColor};
        }
        .classic-nav .classic-nav-logo {
            filter: none;
        }
        .classic-nav:not(.nav-scrolled) .classic-nav-logo {
            filter: brightness(0) invert(1);
        }
        .classic-nav.nav-scrolled .classic-nav-brand {
            color: #1c1917;
        }
        .classic-nav.nav-scrolled .classic-nav-link {
            color: #57534e;
        }
        .classic-nav.nav-scrolled .classic-nav-link:hover {
            color: ${primaryColor};
        }
        .classic-nav.nav-scrolled .classic-nav-menu-btn {
            color: #1c1917;
        }
        .classic-nav.nav-scrolled .classic-nav-menu-btn:hover {
            color: ${primaryColor};
        }
        .classic-nav.nav-scrolled .classic-nav-logo {
            filter: ${shouldColorLogo ? 'none' : 'brightness(0) invert(1)'};
        }${generateSiteNavMobileStyles()}`
  }

  if (theme === 'modern') {
    return `
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
            filter: ${shouldColorLogo ? 'none' : 'brightness(0) invert(1)'};
        }${generateSiteNavMobileStyles()}`
  }

  if (theme === 'dark') {
    return `
        .bold-nav .bold-nav-brand,
        .bold-nav .bold-nav-link,
        .bold-nav .bold-nav-menu-btn {
            color: #F5F5F0;
        }
        .bold-nav .bold-nav-link:hover,
        .bold-nav .bold-nav-menu-btn:hover {
            color: ${primaryColor};
        }
        .bold-nav .bold-nav-logo {
            filter: brightness(0) invert(1);
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
            filter: ${shouldColorLogo ? 'none' : 'brightness(0) invert(1)'};
        }
        .bold-nav .bold-nav-brand .text-primary {
            color: ${primaryColor};
        }${generateSiteNavMobileStyles()}`
  }

  return generateSiteNavMobileStyles()
}

export function createSiteChromeConfig(options: {
  theme: SiteChromeTheme
  studioName: string
  logoUrl: string | null
  primaryColor: string
  homepagePath: string
  linkMode?: SiteChromeLinkMode
  hasFaq?: boolean
  hasPackages?: boolean
  shouldColorLogo?: boolean
}): SiteChromeConfig {
  return {
    theme: options.theme,
    studioName: options.studioName,
    logoUrl: options.logoUrl,
    primaryColor: options.primaryColor,
    homepagePath: options.homepagePath,
    linkMode: options.linkMode ?? 'scroll',
    hasFaq: options.hasFaq ?? false,
    hasPackages: options.hasPackages ?? false,
    shouldColorLogo: options.shouldColorLogo ?? false,
  }
}
