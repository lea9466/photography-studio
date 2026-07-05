const DEFAULT_HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBtc8vYozqzsyyaSs762LNJcnclKdmGuK6RBZsCh9_MldHQKMKggJGAHH3J5iuJgvcCH-Rg_dmsmWUY3qKjIC3VxudGLoH_zp5RlgbhaDLLX8vwYl3u79Wt3ndaPtlt1px4spTUAY7PfRDXX69fTMO-z2V5Ij-GinPBFta-y5hZS2_Zrz3Y4HDR0V-wWv6S5Xqk8ver8tRBpMGDwXazgy0yNIUdjM9KmyqMURhx9mQfOx2xIMXb69yEPxvlkXmYucFWaM5XR-U-KAw'

export const HERO_SLIDESHOW_INTERVAL_MS = 3000
export const HERO_SLIDESHOW_FADE_MS = 2000
export const HERO_SLIDESHOW_FILM_SECONDS_PER_IMAGE = 12

export type HeroSlideshowTransition = 'fade' | 'film'

export const HERO_SLIDESHOW_CSS = `
  .hero-slideshow {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #0a0a0a;
  }
  .hero-slideshow-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .hero-slideshow-layer--mobile { display: block; }
  .hero-slideshow-layer--desktop { display: none; }
  @media (min-width: 768px) {
    .hero-slideshow-layer--mobile { display: none; }
    .hero-slideshow-layer--desktop { display: block; }
  }
  .hero-slide {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transform: scale(1.05);
    transition: opacity ${HERO_SLIDESHOW_FADE_MS}ms ease-in-out,
                transform 10s ease-out;
    will-change: opacity, transform;
    pointer-events: none;
  }
  .hero-slide.is-active {
    opacity: 1;
    transform: scale(1);
    z-index: 2;
  }
  .hero-slide.is-exiting {
    opacity: 0;
    transform: scale(1.015);
    z-index: 1;
    transition: opacity ${HERO_SLIDESHOW_FADE_MS}ms ease-in-out,
                transform ${HERO_SLIDESHOW_FADE_MS}ms ease-in-out;
  }
  .hero-slide--static {
    opacity: 1;
    transform: none;
    transition: none;
    z-index: 1;
  }
  .hero-slideshow--film {
    background: transparent;
  }
  .hero-slideshow--film .hero-slideshow-layer {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
  .hero-slideshow--film .hero-film-track {
    display: flex;
    flex-wrap: nowrap;
    gap: 0;
    height: 100%;
    will-change: transform;
  }
  .hero-slideshow--film .hero-film-track.is-ready {
    animation: heroFilmScroll calc(var(--film-frames) * ${HERO_SLIDESHOW_FILM_SECONDS_PER_IMAGE}s) linear infinite;
  }
  .hero-slideshow--film .hero-film-slide {
    flex: 0 0 var(--film-slide-width, 100vw);
    width: var(--film-slide-width, 100vw);
    min-width: var(--film-slide-width, 100vw);
    max-width: var(--film-slide-width, 100vw);
    height: 100%;
    overflow: hidden;
    line-height: 0;
  }
  .hero-slideshow--film .hero-film-frame {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    pointer-events: none;
  }
  .hero-slideshow--film .hero-slide--static {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  @keyframes heroFilmScroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
`

export const HERO_SLIDESHOW_FILM_INIT_SCRIPT = `
(function initHeroFilmStrips() {
  function syncFilmStrip(layer) {
    var track = layer.querySelector('.hero-film-track');
    if (!track) return true;
    if (getComputedStyle(layer).display === 'none') return true;
    var width = Math.round(layer.getBoundingClientRect().width);
    if (!width) return false;
    var slides = track.querySelectorAll('.hero-film-slide');
    if (!slides.length) return true;
    layer.style.setProperty('--film-slide-width', width + 'px');
    slides.forEach(function(slide) {
      slide.style.width = width + 'px';
      slide.style.flex = '0 0 ' + width + 'px';
      slide.style.minWidth = width + 'px';
      slide.style.maxWidth = width + 'px';
    });
    track.style.width = (slides.length * width) + 'px';
    track.classList.add('is-ready');
    return true;
  }
  function syncAll() {
    document.querySelectorAll('.hero-slideshow--film .hero-slideshow-layer').forEach(syncFilmStrip);
  }
  function boot() {
    var pending = false;
    document.querySelectorAll('.hero-slideshow--film .hero-slideshow-layer').forEach(function(layer) {
      if (!syncFilmStrip(layer)) pending = true;
    });
    if (pending) requestAnimationFrame(boot);
  }
  boot();
  window.addEventListener('resize', syncAll);
  window.addEventListener('load', syncAll);
  document.querySelectorAll('.hero-slideshow--film .hero-film-frame').forEach(function(img) {
    if (img.complete) return;
    img.addEventListener('load', syncAll);
    img.addEventListener('error', syncAll);
  });
  if (typeof ResizeObserver !== 'undefined') {
    document.querySelectorAll('.hero-slideshow--film .hero-slideshow-layer').forEach(function(layer) {
      new ResizeObserver(syncAll).observe(layer);
    });
  }
})();
`

export const HERO_SLIDESHOW_INIT_SCRIPT = `
(function initHeroSlideshow() {
  document.querySelectorAll('[data-hero-slideshow]').forEach(function(root) {
    if (root.getAttribute('data-transition') === 'film') return;
    var transitionMs = parseInt(root.getAttribute('data-transition-ms') || '${HERO_SLIDESHOW_FADE_MS}', 10);
    var interval = parseInt(root.getAttribute('data-interval') || '${HERO_SLIDESHOW_INTERVAL_MS}', 10);
    ['desktop', 'mobile'].forEach(function(layer) {
      var container = root.querySelector('.hero-slideshow-layer--' + layer);
      if (!container) return;
      var slides = Array.from(container.querySelectorAll('.hero-slide:not(.hero-slide--static)'));
      if (slides.length <= 1) return;
      var index = 0;
      var transitioning = false;
      slides.forEach(function(slide, i) {
        slide.classList.toggle('is-active', i === 0);
        slide.classList.remove('is-exiting');
      });
      setInterval(function() {
        if (transitioning) return;
        var current = slides[index];
        var nextIndex = (index + 1) % slides.length;
        var next = slides[nextIndex];
        if (!current || !next || current === next) return;
        transitioning = true;
        next.classList.add('is-active');
        current.classList.remove('is-active');
        current.classList.add('is-exiting');
        setTimeout(function() {
          current.classList.remove('is-exiting');
          transitioning = false;
        }, transitionMs);
        index = nextIndex;
      }, interval);
    });
  });
})();
`

function uniqueImages(images: string[]): string[] {
  const seen = new Set<string>()
  return images.filter((url) => {
    if (!url || seen.has(url)) return false
    seen.add(url)
    return true
  })
}

export function normalizeHeroUrlList(
  urls: string[] | null | undefined,
  fallbackSingle: string | null | undefined,
  defaultImage = DEFAULT_HERO
): string[] {
  const fromArray = uniqueImages(urls ?? [])
  if (fromArray.length > 0) return fromArray.slice(0, 3)
  if (fallbackSingle) return [fallbackSingle]
  return [defaultImage]
}

function hasFilmMotion(
  transition: HeroSlideshowTransition,
  desktopImages: string[],
  mobileImages: string[]
): boolean {
  if (transition !== 'film') return false
  return desktopImages.length > 1 || mobileImages.length > 1
}

export function generateHeroSlideshowHTML(options: {
  desktopImages: string[]
  mobileImages: string[]
  imgClass?: string
  heroId?: string
  alt?: string
  transition?: HeroSlideshowTransition
  intervalMs?: number
  transitionMs?: number
}): string {
  const {
    desktopImages,
    mobileImages,
    imgClass = '',
    heroId = 'hero-slideshow',
    alt = 'סטודיו צילום',
    transition = 'fade',
    intervalMs = HERO_SLIDESHOW_INTERVAL_MS,
    transitionMs = HERO_SLIDESHOW_FADE_MS,
  } = options

  const desktop = uniqueImages(
    desktopImages.length ? desktopImages : mobileImages
  )
  const mobile = uniqueImages(
    mobileImages.length ? mobileImages : desktopImages
  )
  const extraClass = imgClass.trim()
  const desktopAnimate = desktop.length > 1
  const mobileAnimate = mobile.length > 1
  const useFilmMotion = hasFilmMotion(transition, desktop, mobile)
  const slideshowClass = useFilmMotion
    ? 'hero-slideshow hero-slideshow--film'
    : 'hero-slideshow'

  if (transition === 'film' ? !useFilmMotion : !desktopAnimate && !mobileAnimate) {
    const desktopSrc = desktop[0] ?? mobile[0] ?? DEFAULT_HERO
    const mobileSrc = mobile[0] ?? desktopSrc
    return `<div class="${slideshowClass}" id="${heroId}">
<picture class="block w-full h-full">
<source media="(max-width: 768px)" srcset="${mobileSrc}"/>
<img alt="${alt}" class="hero-slide hero-slide--static w-full h-full object-cover ${extraClass}" src="${desktopSrc}"/>
</picture>
</div>`
  }

  const renderLayer = (
    images: string[],
    layer: 'desktop' | 'mobile',
    animate: boolean
  ) => {
    const src = images[0] ?? DEFAULT_HERO
    if (!animate || images.length <= 1) {
      return `<div class="hero-slideshow-layer hero-slideshow-layer--${layer}">
<img src="${src}" alt="${alt}" class="hero-slide hero-slide--static ${extraClass}" loading="eager" decoding="async" />
</div>`
    }

    if (transition === 'film') {
      if (images.length <= 1) {
        return `<div class="hero-slideshow-layer hero-slideshow-layer--${layer}">
<img src="${src}" alt="${alt}" class="hero-slide hero-slide--static ${extraClass}" loading="eager" decoding="async" />
</div>`
      }

      const frameCount = images.length
      const loopImages = [...images, ...images]
      return `<div class="hero-slideshow-layer hero-slideshow-layer--${layer}">
<div class="hero-film-track" style="--film-frames: ${frameCount};">
${loopImages
  .map(
    (imageSrc) =>
      `<div class="hero-film-slide"><img src="${imageSrc}" alt="${alt}" class="hero-film-frame ${extraClass}" loading="eager" decoding="async" /></div>`
  )
  .join('\n')}
</div>
</div>`
    }

    return `<div class="hero-slideshow-layer hero-slideshow-layer--${layer}">
${images
  .map(
    (imageSrc, i) =>
      `<img src="${imageSrc}" alt="${alt}" class="hero-slide ${i === 0 ? 'is-active' : ''} ${extraClass}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" />`
  )
  .join('\n')}
</div>`
  }

  return `<div class="${slideshowClass}" id="${heroId}"${useFilmMotion ? ` data-transition="film"` : ` data-hero-slideshow data-transition="${transition}" data-interval="${intervalMs}" data-transition-ms="${transitionMs}"`}>
${renderLayer(desktop, 'desktop', desktopAnimate)}
${renderLayer(mobile, 'mobile', mobileAnimate)}
</div>`
}
