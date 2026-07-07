export const HERO_EMPTY_PLACEHOLDER_TEXT =
  'כדי להתחיל לערוך את האתר שלך, העלי תמונות רקע'

export const HERO_SLIDESHOW_INTERVAL_MS = 3000
export const HERO_SLIDESHOW_FADE_MS = 2000
export const HERO_SLIDESHOW_FILM_SECONDS_PER_IMAGE = 12
export const MODERN_HERO_FILM_SECONDS_PER_IMAGE = 22

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
  .hero-slideshow--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f2f1ef;
  }
  .hero-empty-placeholder {
    text-align: center;
    padding: 2rem;
    max-width: 28rem;
    color: rgba(15, 15, 13, 0.45);
  }
  .hero-empty-placeholder-icon {
    display: block;
    font-size: 3rem;
    line-height: 1;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  .hero-empty-placeholder-text {
    font-size: 1.125rem;
    line-height: 1.6;
    margin: 0;
  }
  .modern-hero-film-belt--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f2f1ef;
  }
`

export const MODERN_HERO_FILM_BELT_CSS = `
  .modern-hero-film-belt {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
  }
  .modern-hero-film-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    direction: ltr;
  }
  .modern-hero-film-layer--mobile { display: block; }
  .modern-hero-film-layer--desktop { display: none; }
  @media (min-width: 768px) {
    .modern-hero-film-layer--mobile { display: none; }
    .modern-hero-film-layer--desktop { display: block; }
  }
  .modern-hero-film-track {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    direction: ltr;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: calc(var(--hero-film-count, 3) * 2 * 100vw);
    will-change: transform;
  }
  .modern-hero-film-slide {
    flex: 0 0 100vw;
    flex-shrink: 0;
    flex-grow: 0;
    width: 100vw;
    min-width: 100vw;
    max-width: 100vw;
    height: 100%;
    overflow: hidden;
    line-height: 0;
  }
  .modern-hero-film-frame,
  .modern-hero-film-static {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    pointer-events: none;
  }
  .modern-hero-film-static {
    position: absolute;
    inset: 0;
  }
`

export const MODERN_HERO_FILM_INIT_SCRIPT = `
(function initModernHeroFilm() {
  var SECONDS_PER_IMAGE = ${MODERN_HERO_FILM_SECONDS_PER_IMAGE};
  var DEBUG = false;
  function log() {
    if (!DEBUG) return;
    try { console.log.apply(console, ['[modern-hero]'].concat([].slice.call(arguments))); } catch (e) {}
  }

  // Drive the belt entirely via Web Animations API using measured pixels.
  // No CSS percentages / keyframes / vw -> zero ambiguity, zero gaps.
  function setupLayer(layer) {
    var track = layer.querySelector('.modern-hero-film-track');
    if (!track) return;
    var slides = [].slice.call(track.querySelectorAll('.modern-hero-film-slide'));
    if (slides.length < 2) return;

    var width = Math.round(layer.getBoundingClientRect().width);
    if (!width) return;

    // Skip if nothing changed and the animation is already running — avoids
    // restarting the belt (and stale-width shifts) on every image load / reflow.
    if (track.__heroWidth === width && track.__heroAnim && track.__heroAnim.playState === 'running') {
      return;
    }
    track.__heroWidth = width;

    // slides are two identical copies of the image set
    var setCount = slides.length / 2;
    slides.forEach(function(slide) {
      slide.style.width = width + 'px';
      slide.style.minWidth = width + 'px';
      slide.style.maxWidth = width + 'px';
      slide.style.flex = '0 0 ' + width + 'px';
    });
    track.style.width = (slides.length * width) + 'px';

    var shift = setCount * width; // exactly one full image set
    if (track.__heroAnim) {
      try { track.__heroAnim.cancel(); } catch (e) {}
      track.__heroAnim = null;
    }
    if (typeof track.animate === 'function') {
      track.__heroAnim = track.animate(
        [
          { transform: 'translate3d(0px, 0, 0)' },
          { transform: 'translate3d(' + (-shift) + 'px, 0, 0)' }
        ],
        { duration: setCount * SECONDS_PER_IMAGE * 1000, iterations: Infinity, easing: 'linear' }
      );
    }

    var frames = track.querySelectorAll('.modern-hero-film-frame');
    var loaded = 0, broken = 0;
    frames.forEach(function(img) {
      if (img.complete && img.naturalWidth > 0) loaded++;
      else if (img.complete && img.naturalWidth === 0) broken++;
    });
    // MEASURE the real layout (not computed) to see if slides tile horizontally.
    var trackRect = track.getBoundingClientRect();
    var slideLefts = slides.map(function(s) { return Math.round(s.getBoundingClientRect().left); });
    var slideTops = slides.map(function(s) { return Math.round(s.getBoundingClientRect().top); });
    log('layer ready', {
      layer: layer.className,
      slideCount: slides.length,
      slideWidthPx: width,
      computedTrackWidthPx: slides.length * width,
      measuredTrackWidthPx: Math.round(trackRect.width),
      measuredTrackScrollWidthPx: track.scrollWidth,
      trackDisplay: getComputedStyle(track).display,
      trackFlexWrap: getComputedStyle(track).flexWrap,
      slideLefts: slideLefts,
      slideTops: slideTops,
      shiftPx: shift,
      animating: !!track.__heroAnim,
      imagesLoaded: loaded,
      imagesBroken: broken
    });
  }

  function setupAll() {
    var belts = document.querySelectorAll('.modern-hero-film-belt');
    if (!belts.length) { log('no belt found'); return; }
    belts.forEach(function(belt) {
      belt.querySelectorAll('.modern-hero-film-layer').forEach(setupLayer);
    });
  }

  function boot() {
    setupAll();
    window.addEventListener('load', setupAll);
    var t;
    window.addEventListener('resize', function() {
      clearTimeout(t);
      t = setTimeout(setupAll, 150);
    });
    document.querySelectorAll('.modern-hero-film-frame').forEach(function(img) {
      if (img.complete) return;
      img.addEventListener('load', setupAll, { once: true });
      img.addEventListener('error', function() { log('image error', img.src); setupAll(); }, { once: true });
    });
    // Track real size changes of each layer (e.g. devtools docking, sidebar).
    if (typeof ResizeObserver !== 'undefined') {
      document.querySelectorAll('.modern-hero-film-layer').forEach(function(layer) {
        var ro = new ResizeObserver(function() {
          clearTimeout(t);
          t = setTimeout(setupAll, 150);
        });
        ro.observe(layer);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
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
  crossVariantFallback?: string | null | undefined
): string[] {
  const fromArray = uniqueImages(urls ?? [])
  if (fromArray.length > 0) return fromArray.slice(0, 3)
  if (fallbackSingle) return [fallbackSingle]
  if (crossVariantFallback) return [crossVariantFallback]
  return []
}

function generateHeroEmptyPlaceholderHTML(options: {
  heroId: string
  wrapperClass: string
}): string {
  const { heroId, wrapperClass } = options
  return `<div class="${wrapperClass}" id="${heroId}">
<div class="hero-empty-placeholder">
<span class="material-symbols-outlined hero-empty-placeholder-icon" aria-hidden="true">photo_camera</span>
<p class="hero-empty-placeholder-text">${HERO_EMPTY_PLACEHOLDER_TEXT}</p>
</div>
</div>`
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

  if (desktop.length === 0 && mobile.length === 0) {
    return generateHeroEmptyPlaceholderHTML({
      heroId,
      wrapperClass: 'hero-slideshow hero-slideshow--empty',
    })
  }

  const extraClass = imgClass.trim()
  const desktopAnimate = desktop.length > 1
  const mobileAnimate = mobile.length > 1
  const useFilmMotion = hasFilmMotion(transition, desktop, mobile)
  const slideshowClass = useFilmMotion
    ? 'hero-slideshow hero-slideshow--film'
    : 'hero-slideshow'

  if (transition === 'film' ? !useFilmMotion : !desktopAnimate && !mobileAnimate) {
    const desktopSrc = desktop[0] ?? mobile[0]
    const mobileSrc = mobile[0] ?? desktopSrc
    if (!desktopSrc || !mobileSrc) {
      return generateHeroEmptyPlaceholderHTML({
        heroId,
        wrapperClass: 'hero-slideshow hero-slideshow--empty',
      })
    }
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
    const src = images[0]
    if (!src) return ''
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

export function generateModernHeroFilmBeltHTML(options: {
  desktopImages: string[]
  mobileImages: string[]
  heroId?: string
  alt?: string
}): string {
  const {
    desktopImages,
    mobileImages,
    heroId = 'modern-hero-film',
    alt = 'סטודיו צילום',
  } = options

  const desktop = uniqueImages(
    desktopImages.length ? desktopImages : mobileImages
  )
  const mobile = uniqueImages(
    mobileImages.length ? mobileImages : desktopImages
  )

  if (desktop.length === 0 && mobile.length === 0) {
    return generateHeroEmptyPlaceholderHTML({
      heroId,
      wrapperClass: 'modern-hero-film-belt modern-hero-film-belt--empty',
    })
  }

  const renderLayer = (images: string[], layer: 'desktop' | 'mobile') => {
    const src = images[0]
    if (!src) return ''
    if (images.length <= 1) {
      return `<div class="modern-hero-film-layer modern-hero-film-layer--${layer}">
<img src="${src}" alt="${alt}" class="modern-hero-film-static" loading="eager" decoding="async" />
</div>`
    }

    const count = images.length
    const beltImages = [...images, ...images]
    return `<div class="modern-hero-film-layer modern-hero-film-layer--${layer}">
<div class="modern-hero-film-track" style="--hero-film-count: ${count};">
${beltImages
  .map(
    (imageSrc) =>
      `<div class="modern-hero-film-slide"><img src="${imageSrc}" alt="${alt}" class="modern-hero-film-frame" loading="eager" decoding="async" /></div>`
  )
  .join('\n')}
</div>
</div>`
  }

  return `<div class="modern-hero-film-belt" id="${heroId}">
${renderLayer(desktop, 'desktop')}
${renderLayer(mobile, 'mobile')}
</div>`
}
