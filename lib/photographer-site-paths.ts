import { getPublicSitePath } from '@/lib/queries/public-photographer'

export type PhotographerSiteTheme = 'elegant' | 'modern' | 'classic' | 'bold'

export function normalizeSiteTheme(theme: string | null | undefined): PhotographerSiteTheme {
  if (theme === 'modern' || theme === 'classic' || theme === 'bold' || theme === 'dark') {
    return theme === 'dark' ? 'bold' : theme
  }
  return 'elegant'
}

export function resolveHomepagePath(slug: string | null | undefined, studioName: string | null | undefined) {
  return getPublicSitePath(slug, studioName) ?? '/'
}

export function getSiteSectionIds(theme: PhotographerSiteTheme) {
  if (theme === 'modern') {
    return { home: '', gallery: 'portfolio', pricing: 'pricing', contact: 'contact' }
  }
  if (theme === 'classic') {
    return { home: '', gallery: 'galleries', pricing: 'pricing', contact: 'contact' }
  }
  return { home: '', gallery: 'gallery', pricing: 'pricing', contact: 'contact' }
}

export function homepageSectionHref(homepagePath: string, sectionId: string) {
  if (!sectionId) return homepagePath
  const separator = homepagePath.includes('?') ? '&' : '?'
  return `${homepagePath}${separator}section=${encodeURIComponent(sectionId)}`
}

export function readHomepageInitialSection(search: string, hash: string) {
  const fromQuery = new URLSearchParams(search).get('section')?.trim()
  if (fromQuery) return fromQuery
  const fromHash = hash.replace(/^#/, '').trim()
  return fromHash || null
}

export function homepageScrollToTopAction(closeMenu?: string) {
  const close = closeMenu ? `; ${closeMenu}` : ''
  return `onclick="window.scrollTo({top: 0, behavior: 'smooth'});try{var p=window.parent.location;if(p.search||p.hash)window.parent.history.replaceState(null,'',p.pathname)}catch(e){}${close}"`
}

export function generateHomepageSectionScrollScript(sectionId: string | null | undefined) {
  if (!sectionId) return ''
  const safeId = sectionId.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safeId) return ''

  return `
(function scrollToHomepageSection() {
  var sectionId = ${JSON.stringify(safeId)};
  function cleanParentUrl() {
    try {
      var parentLoc = window.parent.location;
      if (parentLoc.search || parentLoc.hash) {
        window.parent.history.replaceState(null, '', parentLoc.pathname);
      }
    } catch (e) {}
  }
  function scrollToSection() {
    var el = document.getElementById(sectionId);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    cleanParentUrl();
    return true;
  }
  function boot() {
    if (scrollToSection()) return;
    var attempts = 0;
    var timer = window.setInterval(function() {
      attempts += 1;
      if (scrollToSection() || attempts >= 30) {
        window.clearInterval(timer);
      }
    }, 100);
  }
  if (document.readyState === 'complete') {
    window.setTimeout(boot, 50);
  } else {
    window.addEventListener('load', function() { window.setTimeout(boot, 50); });
  }
})();`
}
