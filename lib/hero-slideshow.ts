const DEFAULT_HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBtc8vYozqzsyyaSs762LNJcnclKdmGuK6RBZsCh9_MldHQKMKggJGAHH3J5iuJgvcCH-Rg_dmsmWUY3qKjIC3VxudGLoH_zp5RlgbhaDLLX8vwYl3u79Wt3ndaPtlt1px4spTUAY7PfRDXX69fTMO-z2V5Ij-GinPBFta-y5hZS2_Zrz3Y4HDR0V-wWv6S5Xqk8ver8tRBpMGDwXazgy0yNIUdjM9KmyqMURhx9mQfOx2xIMXb69yEPxvlkXmYucFWaM5XR-U-KAw'

export const HERO_SLIDESHOW_INTERVAL_MS = 3000
export const HERO_SLIDESHOW_FADE_MS = 2000

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
`

export const HERO_SLIDESHOW_INIT_SCRIPT = `
(function initHeroSlideshow() {
  var fadeMs = ${HERO_SLIDESHOW_FADE_MS};
  document.querySelectorAll('[data-hero-slideshow]').forEach(function(root) {
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
        }, fadeMs);
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

export function generateHeroSlideshowHTML(options: {
  desktopImages: string[]
  mobileImages: string[]
  imgClass?: string
  heroId?: string
  alt?: string
}): string {
  const {
    desktopImages,
    mobileImages,
    imgClass = '',
    heroId = 'hero-slideshow',
    alt = 'סטודיו צילום',
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

  if (!desktopAnimate && !mobileAnimate) {
    const desktopSrc = desktop[0] ?? mobile[0] ?? DEFAULT_HERO
    const mobileSrc = mobile[0] ?? desktopSrc
    return `<picture>
<source media="(max-width: 768px)" srcset="${mobileSrc}"/>
<img alt="${alt}" class="w-full h-full object-cover ${extraClass}" src="${desktopSrc}"/>
</picture>`
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

    return `<div class="hero-slideshow-layer hero-slideshow-layer--${layer}">
${images
  .map(
    (imageSrc, i) =>
      `<img src="${imageSrc}" alt="${alt}" class="hero-slide ${i === 0 ? 'is-active' : ''} ${extraClass}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" />`
  )
  .join('\n')}
</div>`
  }

  return `<div class="hero-slideshow" id="${heroId}" data-hero-slideshow data-interval="${HERO_SLIDESHOW_INTERVAL_MS}">
${renderLayer(desktop, 'desktop', desktopAnimate)}
${renderLayer(mobile, 'mobile', mobileAnimate)}
</div>`
}
