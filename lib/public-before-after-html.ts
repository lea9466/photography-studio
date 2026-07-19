import {
  buildPublicSiteChrome,
  generateSiteFooter,
  generateSiteNav,
  generateSiteNavScrollScript,
  generateSiteNavStyles,
  publicSiteLtrCss,
  publicSitePageHtmlAttrs,
  type SiteChromeTheme,
} from '@/lib/photographer-site-chrome'
import type { PhotographerSiteTheme } from '@/lib/photographer-site-paths'
import { resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'

export type PublicBeforeAfterItem = {
  id: string
  title: string | null
  description: string | null
  originalImageUrl: string
  editedImageUrl: string
  displayStyle: string
}

export type PublicBeforeAfterPageData = {
  pageTitle: string
  intro: string
  accentColor: string
  items: PublicBeforeAfterItem[]
}

function toChromeTheme(theme: PhotographerSiteTheme): SiteChromeTheme {
  return theme === 'bold' ? 'dark' : theme
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

type ThemeTokens = {
  bg: string
  surface: string
  text: string
  variant: string
  outline: string
  frameBg: string
  /** Matches homepage gallery media radius (GALLERY_RADIUS_BY_THEME). */
  imageRadius: string
  cardShadow: string
}

const TOKENS: Record<SiteChromeTheme, ThemeTokens> = {
  elegant: {
    bg: '#FAFAF8',
    surface: '#fdf8f7',
    text: '#1c1b1b',
    variant: '#464742',
    outline: '#c7c7c0',
    frameBg: 'rgba(28, 27, 27, 0.035)',
    imageRadius: '0px',
    cardShadow: 'none',
  },
  classic: {
    bg: '#FAFAF8',
    surface: '#ffffff',
    text: '#1c1917',
    variant: '#57534e',
    outline: '#d6d3d1',
    frameBg: 'rgba(28, 25, 23, 0.035)',
    imageRadius: '4px',
    cardShadow: '0 10px 28px rgba(28, 25, 23, 0.08)',
  },
  modern: {
    bg: '#F8FAFC',
    surface: '#ffffff',
    text: '#0F172A',
    variant: '#475569',
    outline: '#cbd5e1',
    frameBg: 'rgba(15, 23, 42, 0.035)',
    imageRadius: '12px',
    cardShadow: '0 18px 50px rgba(15, 23, 42, 0.1)',
  },
  dark: {
    bg: '#121217',
    surface: '#1A1A22',
    text: '#F5F5F0',
    variant: '#B8B8C0',
    outline: 'rgba(255,255,255,0.12)',
    frameBg: 'rgba(255, 255, 255, 0.04)',
    imageRadius: '0px',
    cardShadow: 'none',
  },
}

function titleFontClass(theme: SiteChromeTheme) {
  if (theme === 'elegant' || theme === 'classic') return 'font-serif-hebrew'
  return 'font-headline font-bold'
}

function pageCopy(language: SiteLanguage) {
  const he = language !== 'en'
  return {
    eyebrow: he ? 'תהליך העריכה' : 'THE EDITING PROCESS',
    tag: he ? 'לפני ואחרי עיבוד' : 'Before & after editing',
    howTo: he
      ? 'גררו על התמונה או השתמשו בכפתור כדי לראות את המקור.'
      : 'Drag across the image or use the button to see the original.',
    lensLabel: he ? 'מקור' : 'Original',
    statusEdited: he ? 'תוצאה סופית' : 'Final edit',
    statusOriginal: he ? 'מקור' : 'Original',
    showOriginal: he ? 'הצגת המקור' : 'Show original',
    showResult: he ? 'חזרה לתוצאה המעובדת' : 'Back to the edited result',
    loadError: he ? 'לא הצלחנו לטעון את ההשוואה' : 'We could not load this comparison',
    missingOriginal: he
      ? 'תמונת המקור אינה זמינה כרגע'
      : 'The original image is unavailable right now',
    regionLabel: he
      ? 'עדשת חשיפה — הזיזו כדי לראות את המקור'
      : 'Reveal lens — move to see the original',
  }
}

const REVEAL_LENS_CSS = `
.ba-page {
  padding-top: calc(7.25rem + 50px);
  padding-bottom: 3.5rem;
}
.ba-header {
  max-width: 40rem;
  margin: 0 auto clamp(1.75rem, 4vh, 2.75rem);
  padding-inline: 1.25rem;
  text-align: center;
}
.ba-header__eyebrow {
  display: block;
  margin-top: 0.35rem;
  margin-bottom: 0.75rem;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.45;
}
.ba-header h1 {
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  line-height: 1.15;
  margin: 0;
  font-weight: 500;
}
.ba-header p {
  margin: 0.75rem auto 0;
  max-width: 32rem;
  font-size: 0.98rem;
  line-height: 1.7;
  opacity: 0.72;
}
.ba-list {
  display: grid;
  grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.45fr);
  column-gap: clamp(32px, 5vw, 72px);
  row-gap: 0;
  max-width: 1180px;
  margin: 0 auto;
  padding-inline: 1rem;
  align-items: start;
}
.comparison-section {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  column-gap: clamp(32px, 5vw, 72px);
  align-items: start;
  min-height: auto;
  padding-block: calc(clamp(48px, 7vh, 96px) + 25px);
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.comparison-section.is-visible {
  opacity: 1;
  transform: none;
}
.comparison-layout {
  display: contents;
}
.comparison-content {
  grid-column: 1;
  text-align: start;
  min-width: 0;
  align-self: center;
}
.comparison-tag {
  display: inline-block;
  margin: 0 0 0.85rem;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.5;
}
.comparison-number-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.comparison-number {
  position: relative;
  color: var(--brand-primary);
  font-size: clamp(42px, 4vw, 68px);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  opacity: 0.9;
}
.comparison-number::before {
  content: "";
  position: absolute;
  inset: 50% auto auto 50%;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--brand-primary);
  opacity: 0.07;
  transform: translate(-50%, -50%);
  z-index: -1;
}
.comparison-number-line {
  width: 54px;
  height: 1px;
  background: var(--brand-primary);
  opacity: 0.35;
  flex-shrink: 0;
}
.comparison-title {
  margin: 0 0 0.75rem;
  font-size: clamp(26px, 3vw, 42px);
  line-height: 1.15;
  font-weight: 500;
}
.comparison-desc {
  margin: 0 0 1rem;
  max-width: 420px;
  font-size: clamp(15px, 1.35vw, 18px);
  line-height: 1.7;
  opacity: 0.75;
}
.comparison-howto {
  margin: 0 0 1.25rem;
  max-width: 420px;
  font-size: 0.92rem;
  line-height: 1.65;
  opacity: 0.58;
}
.comparison-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.55rem 1.1rem;
  border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
  border-radius: 9999px;
  background: transparent;
  color: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
}
.comparison-toggle:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 6%, transparent);
}
.comparison-toggle:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
.comparison-toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.comparison-media {
  grid-column: 2;
  align-self: start;
  justify-self: stretch;
  min-width: 0;
  position: relative;
  width: 100%;
  max-width: 100%;
  max-height: min(68vh, 620px);
  pointer-events: auto;
  overflow: visible;
  border-radius: var(--theme-image-radius, var(--theme-card-radius, 12px));
}
.comparison-frame {
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 100%;
  height: auto;
  aspect-ratio: var(--comparison-aspect-ratio, 4 / 3);
  max-height: min(68vh, 620px);
  border-radius: var(--theme-image-radius, var(--theme-card-radius, 12px));
  overflow: hidden;
  background: transparent;
  box-shadow: var(--theme-card-shadow, none);
  border: none;
  touch-action: pan-y;
  outline: none;
  pointer-events: auto;
  --lens-x: 50%;
  --lens-y: 50%;
  --lens-radius: 105px;
  --comparison-aspect-ratio: 4 / 3;
  cursor: default;
}
.comparison-frame:not(.is-ready) {
  cursor: default;
}
.comparison-frame.is-ready {
  cursor: crosshair;
}
.comparison-frame.is-dragging {
  touch-action: none;
}
.comparison-frame:focus-visible {
  box-shadow:
    var(--theme-card-shadow, none),
    0 0 0 2px rgba(255,255,255,0.85),
    0 0 0 4px rgba(0,0,0,0.28);
}
@media (max-height: 760px) and (min-width: 900px) {
  .comparison-media {
    max-height: min(62vh, 520px);
  }
  .comparison-frame {
    max-height: min(62vh, 520px);
    --lens-radius: 90px;
  }
}
.comparison-image,
.comparison-original-layer,
.comparison-lens,
.comparison-status,
.comparison-skeleton,
.comparison-error,
.comparison-missing-original {
  pointer-events: none;
}
.comparison-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  border-radius: inherit;
}
.comparison-image--edited {
  z-index: 1;
}
.comparison-original-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  opacity: 0;
  visibility: hidden;
  clip-path: circle(0px at var(--lens-x, 50%) var(--lens-y, 50%));
  -webkit-clip-path: circle(0px at var(--lens-x, 50%) var(--lens-y, 50%));
  transition:
    opacity 160ms ease,
    visibility 0s linear 160ms;
}
.comparison-frame.is-interacting .comparison-original-layer {
  opacity: 1;
  visibility: visible;
  clip-path: circle(var(--lens-radius) at var(--lens-x) var(--lens-y));
  -webkit-clip-path: circle(var(--lens-radius) at var(--lens-x) var(--lens-y));
  transition: opacity 120ms ease;
}
.comparison-frame.show-full-original .comparison-original-layer {
  opacity: 1;
  visibility: visible;
  clip-path: circle(150% at 50% 50%) !important;
  -webkit-clip-path: circle(150% at 50% 50%) !important;
  transition: opacity 280ms ease;
}
.comparison-frame.show-full-original .comparison-lens,
.comparison-frame:not(.is-ready) .comparison-lens,
.comparison-frame.is-edited-only .comparison-lens,
.comparison-frame.is-error .comparison-lens {
  opacity: 0 !important;
  visibility: hidden !important;
}
.comparison-lens {
  position: absolute;
  z-index: 3;
  left: var(--lens-x);
  top: var(--lens-y);
  width: calc(var(--lens-radius) * 2);
  height: calc(var(--lens-radius) * 2);
  transform: translate(-50%, -50%) scale(0.92);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.14), transparent 55%);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 180ms ease,
    transform 220ms ease,
    visibility 0s linear 220ms;
}
.comparison-frame.is-interacting .comparison-lens {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}
.comparison-lens span {
  position: absolute;
  left: 50%;
  bottom: 14%;
  transform: translateX(-50%);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0,0,0,0.45);
  white-space: nowrap;
}
.comparison-status {
  position: absolute;
  z-index: 8;
  inset-inline-start: 1rem;
  top: 0;
  transform: translateY(-50%);
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}
.comparison-media.is-ready .comparison-status {
  opacity: 0.95;
}
.comparison-skeleton {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(180,180,180,0.12),
    rgba(220,220,220,0.26),
    rgba(180,180,180,0.12)
  );
  background-size: 200% 100%;
  animation: ba-shimmer 1.2s linear infinite;
}
.comparison-frame.is-ready .comparison-skeleton,
.comparison-frame.is-error .comparison-skeleton,
.comparison-frame.is-edited-only .comparison-skeleton,
.comparison-frame.missing-original-image .comparison-skeleton {
  display: none;
}
@keyframes ba-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
.comparison-error {
  position: absolute;
  inset: 0;
  z-index: 7;
  display: none;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.5rem;
  font-size: 0.95rem;
  pointer-events: none;
  background: var(--ba-frame-bg, rgba(0, 0, 0, 0.035));
}
.comparison-frame.is-error .comparison-error {
  display: flex;
}
.comparison-missing-original {
  position: absolute;
  z-index: 5;
  inset-inline: 0.9rem;
  bottom: 0.85rem;
  display: none;
  padding: 0.35rem 0.65rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  text-align: center;
}
.comparison-frame.missing-original-image .comparison-missing-original,
.comparison-frame.is-edited-only .comparison-missing-original {
  display: inline-flex;
}
.comparison-frame.missing-original-image .comparison-lens,
.comparison-frame.is-edited-only .comparison-lens,
.comparison-media.missing-original-image .comparison-status {
  display: none !important;
}
@media (max-width: 850px) {
  .ba-list {
    grid-template-columns: 1fr;
    row-gap: 0;
  }
  .comparison-section {
    grid-template-columns: 1fr;
    row-gap: 24px;
  }
  .comparison-content,
  .comparison-media {
    grid-column: 1;
  }
  .comparison-content { order: 1; }
  .comparison-media {
    order: 2;
    max-height: min(62vh, 520px);
  }
  .comparison-frame {
    max-height: min(62vh, 520px);
    --lens-radius: 78px;
  }
  .comparison-number {
    font-size: clamp(36px, 10vw, 56px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .comparison-section {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .comparison-skeleton { animation: none; }
  .comparison-original-layer,
  .comparison-lens,
  .comparison-status {
    transition: none;
  }
}
`

const REVEAL_LENS_SCRIPT = `
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hasDimensions(image) {
    return image.naturalWidth > 0 && image.naturalHeight > 0;
  }

  /**
   * Reliable image wait for cache + lazy + decoding=async.
   * Important: the load event can fire before naturalWidth is populated.
   * Rejecting immediately in that case disabled the 2nd pair incorrectly.
   */
  function waitForImage(image) {
    return new Promise(function (resolve, reject) {
      if (image.complete && hasDimensions(image)) {
        resolve(image);
        return;
      }

      var settled = false;

      function finishOk() {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(image);
      }

      function finishErr(message) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(message));
      }

      function cleanup() {
        image.removeEventListener('load', onLoad);
        image.removeEventListener('error', onError);
      }

      function confirmDimensions() {
        if (hasDimensions(image)) {
          finishOk();
          return;
        }
        if (typeof image.decode === 'function') {
          image.decode().then(function () {
            if (hasDimensions(image)) finishOk();
            else finishErr('Image loaded without dimensions: ' + (image.currentSrc || image.src));
          }).catch(function () {
            // decode can fail even when the bitmap is usable
            if (hasDimensions(image)) finishOk();
            else {
              requestAnimationFrame(function () {
                if (hasDimensions(image)) finishOk();
                else finishErr('Image loaded without dimensions: ' + (image.currentSrc || image.src));
              });
            }
          });
          return;
        }
        requestAnimationFrame(function () {
          if (hasDimensions(image)) finishOk();
          else finishErr('Image loaded without dimensions: ' + (image.currentSrc || image.src));
        });
      }

      function onLoad() {
        confirmDimensions();
      }

      function onError() {
        finishErr('Failed to load image: ' + (image.currentSrc || image.src));
      }

      image.addEventListener('load', onLoad, { once: true });
      image.addEventListener('error', onError, { once: true });

      if (image.complete && hasDimensions(image)) {
        finishOk();
        return;
      }

      // Broken image that already finished — load will not fire again.
      if (image.complete && !hasDimensions(image) && image.getAttribute('loading') !== 'lazy') {
        finishErr('Image has no natural dimensions: ' + (image.currentSrc || image.src));
      }
    });
  }

  function promoteLazyImage(image) {
    if (!image || image.getAttribute('loading') !== 'lazy') return;
    if (image.complete && hasDimensions(image)) return;
    image.loading = 'eager';
  }

  function applyFrameAspectRatio(frame, editedImage, originalImage) {
    var width = editedImage.naturalWidth;
    var height = editedImage.naturalHeight;
    if (!width || !height) return;

    // Keep every pair at the full column width; only the height follows aspect-ratio.
    frame.style.width = '';
    frame.style.maxWidth = '';
    frame.style.setProperty('--comparison-aspect-ratio', width + ' / ' + height);

    if (originalImage.naturalWidth > 0 && originalImage.naturalHeight > 0) {
      var editedRatio = width / height;
      var originalRatio = originalImage.naturalWidth / originalImage.naturalHeight;
      if (Math.abs(editedRatio - originalRatio) > 0.02) {
        console.warn('Before/after images use different aspect ratios', {
          comparisonId: frame.getAttribute('data-comparison-id'),
          editedRatio: editedRatio,
          originalRatio: originalRatio,
        });
      }
    }
  }

  function initializePointerInteraction(frame, originalLayer, getShowingOriginal) {
    var dragging = false;
    var pending = null;

    function lensRadiusPx() {
      var raw = getComputedStyle(frame).getPropertyValue('--lens-radius').trim();
      var parsed = parseFloat(raw);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 105;
    }

    function updatePosition(clientX, clientY, withReveal) {
      var rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = clamp(clientX - rect.left, 0, rect.width);
      var y = clamp(clientY - rect.top, 0, rect.height);
      frame.style.setProperty('--lens-x', ((x / rect.width) * 100).toFixed(3) + '%');
      frame.style.setProperty('--lens-y', ((y / rect.height) * 100).toFixed(3) + '%');

      if (getShowingOriginal()) return;

      if (withReveal) {
        var radius = lensRadiusPx();
        var clip = 'circle(' + radius + 'px at ' + x.toFixed(2) + 'px ' + y.toFixed(2) + 'px)';
        originalLayer.style.clipPath = clip;
        originalLayer.style.webkitClipPath = clip;
      }
    }

    function hideLens() {
      frame.classList.remove('is-interacting', 'is-dragging');
      if (getShowingOriginal()) return;
      var idle = 'circle(0px at 50% 50%)';
      originalLayer.style.clipPath = idle;
      originalLayer.style.webkitClipPath = idle;
    }

    frame.addEventListener('pointerenter', function (event) {
      if (!frame.classList.contains('is-ready') || getShowingOriginal()) return;
      if (event.pointerType === 'touch') return;
      updatePosition(event.clientX, event.clientY, true);
      requestAnimationFrame(function () {
        frame.classList.add('is-interacting');
      });
    });

    frame.addEventListener('pointermove', function (event) {
      if (!frame.classList.contains('is-ready') || getShowingOriginal()) return;

      if (pending && event.pointerId === pending.id) {
        var dx = event.clientX - pending.x;
        var dy = event.clientY - pending.y;
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          pending = null;
          hideLens();
          return;
        }
        pending = null;
        dragging = true;
        frame.classList.add('is-dragging', 'is-interacting');
        try { frame.setPointerCapture(event.pointerId); } catch (e) {}
        updatePosition(event.clientX, event.clientY, true);
        event.preventDefault();
        return;
      }

      if (event.pointerType === 'touch' && !(frame.hasPointerCapture && frame.hasPointerCapture(event.pointerId))) {
        return;
      }

      if (dragging || frame.classList.contains('is-interacting')) {
        updatePosition(event.clientX, event.clientY, true);
        if (dragging) event.preventDefault();
      }
    });

    frame.addEventListener('pointerleave', function (event) {
      if (event.pointerType === 'touch') return;
      if (dragging) return;
      hideLens();
    });

    frame.addEventListener('pointerdown', function (event) {
      if (!frame.classList.contains('is-ready') || getShowingOriginal()) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      if (event.pointerType === 'touch' || coarse) {
        pending = { id: event.pointerId, x: event.clientX, y: event.clientY };
        updatePosition(event.clientX, event.clientY, true);
        frame.classList.add('is-interacting');
        return;
      }

      updatePosition(event.clientX, event.clientY, true);
      frame.classList.add('is-interacting');
    });

    function endInteraction(event) {
      pending = null;
      if (frame.hasPointerCapture && frame.hasPointerCapture(event.pointerId)) {
        try { frame.releasePointerCapture(event.pointerId); } catch (e) {}
      }
      dragging = false;
      frame.classList.remove('is-dragging');
      if (event.pointerType === 'touch' || coarse) {
        hideLens();
      }
    }

    frame.addEventListener('pointerup', endInteraction);
    frame.addEventListener('pointercancel', endInteraction);

    frame.addEventListener('keydown', function (event) {
      if (!frame.classList.contains('is-ready') || getShowingOriginal()) return;
      var rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = (parseFloat(frame.style.getPropertyValue('--lens-x')) || 50) / 100 * rect.width;
      var y = (parseFloat(frame.style.getPropertyValue('--lens-y')) || 50) / 100 * rect.height;
      var stepX = rect.width * (event.shiftKey ? 0.08 : 0.03);
      var stepY = rect.height * (event.shiftKey ? 0.08 : 0.03);
      var handled = true;
      if (event.key === 'ArrowLeft') x -= stepX;
      else if (event.key === 'ArrowRight') x += stepX;
      else if (event.key === 'ArrowUp') y -= stepY;
      else if (event.key === 'ArrowDown') y += stepY;
      else handled = false;
      if (!handled) return;
      event.preventDefault();
      updatePosition(rect.left + x, rect.top + y, true);
      frame.classList.add('is-interacting');
    });

    return { hideLens: hideLens, updatePosition: updatePosition };
  }

  function initComparisonFrame(frame) {
    if (frame.dataset.initialized === 'true') return;
    frame.dataset.initialized = 'true';

    var section = frame.closest('[data-comparison-section]');
    var editedImage = frame.querySelector('[data-edited-image]');
    var originalImage = frame.querySelector('[data-original-image]');
    var lens = frame.querySelector('[data-comparison-lens]');
    var originalLayer = frame.querySelector('[data-original-layer]');
    var toggleButton = section ? section.querySelector('[data-comparison-toggle]') : null;
    var media = frame.parentElement;
    var statusEl = media
      ? media.querySelector('[data-comparison-status]')
      : frame.querySelector('[data-comparison-status]');
    var missingEl = frame.querySelector('[data-comparison-missing-original]');
    var showOriginalLabel = frame.getAttribute('data-label-show-original') || '';
    var showResultLabel = frame.getAttribute('data-label-show-result') || '';
    var statusEdited = frame.getAttribute('data-label-status-edited') || '';
    var statusOriginal = frame.getAttribute('data-label-status-original') || '';

    if (!section || !editedImage || !originalImage || !lens || !originalLayer) {
      frame.classList.add('has-error', 'is-error');
      if (toggleButton) toggleButton.disabled = true;
      return;
    }

    if (toggleButton) {
      toggleButton.disabled = true;
      toggleButton.setAttribute('aria-disabled', 'true');
    }

    var showingOriginal = false;
    var interaction = null;

    function bindToggle() {
      if (!toggleButton || toggleButton.dataset.bound === 'true') return;
      toggleButton.dataset.bound = 'true';
      toggleButton.addEventListener('click', function () {
        if (!frame.classList.contains('is-ready') || !frame.classList.contains('has-original-image')) {
          return;
        }
        showingOriginal = frame.classList.toggle('show-full-original');
        toggleButton.setAttribute('aria-pressed', showingOriginal ? 'true' : 'false');
        toggleButton.textContent = showingOriginal ? showResultLabel : showOriginalLabel;
        if (statusEl) {
          statusEl.textContent = showingOriginal ? statusOriginal : statusEdited;
        }
        if (showingOriginal) {
          frame.classList.remove('is-interacting');
          originalLayer.style.clipPath = 'circle(150% at 50% 50%)';
          originalLayer.style.webkitClipPath = 'circle(150% at 50% 50%)';
        } else if (interaction) {
          interaction.hideLens();
        }
      });
    }

    function markFullyReady() {
      applyFrameAspectRatio(frame, editedImage, originalImage);
      frame.classList.add('is-ready', 'has-original-image');
      frame.classList.remove(
        'is-interacting',
        'is-error',
        'has-error',
        'is-edited-only',
        'missing-original-image'
      );
      if (media) {
        media.classList.add('is-ready');
        media.classList.remove('missing-original-image');
      }
      if (missingEl) missingEl.hidden = true;
      if (toggleButton) {
        toggleButton.disabled = false;
        toggleButton.removeAttribute('aria-disabled');
      }
      if (statusEl) statusEl.textContent = statusEdited;
      interaction = initializePointerInteraction(frame, originalLayer, function () {
        return showingOriginal;
      });
      interaction.hideLens();
      bindToggle();
    }

    function markEditedOnly() {
      applyFrameAspectRatio(frame, editedImage, originalImage);
      frame.classList.add('is-ready', 'is-edited-only', 'missing-original-image');
      frame.classList.remove('is-interacting', 'is-error', 'has-error', 'has-original-image');
      if (media) {
        media.classList.add('is-ready', 'missing-original-image');
      }
      if (missingEl) missingEl.hidden = false;
      if (toggleButton) {
        toggleButton.disabled = true;
        toggleButton.setAttribute('aria-disabled', 'true');
      }
      if (statusEl) statusEl.textContent = statusEdited;
      bindToggle();
    }

    function runInit() {
      waitForImage(editedImage)
        .then(function () {
          return waitForImage(originalImage)
            .then(function () {
              markFullyReady();
            })
            .catch(function (originalError) {
              console.error('Comparison original image failed', {
                comparisonId: frame.getAttribute('data-comparison-id'),
                error: originalError && originalError.message ? originalError.message : originalError,
                originalSrc: originalImage.currentSrc || originalImage.src,
              });
              markEditedOnly();
            });
        })
        .catch(function (editedError) {
          console.error('Comparison initialization failed', {
            comparisonId: frame.getAttribute('data-comparison-id'),
            error: editedError && editedError.message ? editedError.message : editedError,
            editedSrc: editedImage.currentSrc || editedImage.src,
            originalSrc: originalImage.currentSrc || originalImage.src,
          });
          frame.classList.add('has-error', 'is-error');
          if (toggleButton) {
            toggleButton.disabled = true;
            toggleButton.setAttribute('aria-disabled', 'true');
          }
        });
    }

    // Promote lazy images when the pair nears the viewport (helps inside srcdoc iframes).
    if ('IntersectionObserver' in window) {
      var promoteIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            promoteLazyImage(editedImage);
            promoteLazyImage(originalImage);
            promoteIo.disconnect();
          });
        },
        { root: null, rootMargin: '240px 0px', threshold: 0.01 }
      );
      promoteIo.observe(frame);
    } else {
      promoteLazyImage(editedImage);
      promoteLazyImage(originalImage);
    }

    runInit();

    window.addEventListener('resize', function () {
      if (!frame.classList.contains('is-ready')) return;
      if (editedImage.naturalWidth > 0 && editedImage.naturalHeight > 0) {
        applyFrameAspectRatio(frame, editedImage, originalImage);
      }
    });
  }

  function initComparisons() {
    document.querySelectorAll('[data-comparison-frame]').forEach(function (frame) {
      try {
        initComparisonFrame(frame);
      } catch (error) {
        console.error('Comparison initialization failed', {
          comparisonId: frame.getAttribute('data-comparison-id'),
          error: error,
        });
        frame.classList.add('has-error', 'is-error');
      }
    });

    var sections = document.querySelectorAll('[data-comparison-section]');
    if (reduced || !('IntersectionObserver' in window)) {
      sections.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    sections.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComparisons);
  } else {
    initComparisons();
  }
})();
`

function padIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

function renderComparisonSection(
  item: PublicBeforeAfterItem,
  index: number,
  language: SiteLanguage,
  titleClass: string
): string {
  const copy = pageCopy(language)
  const hasTitle = Boolean(item.title?.trim())
  const hasDescription = Boolean(item.description?.trim())
  const loading = index === 0 ? 'eager' : 'lazy'
  const alt = item.title?.trim()
    ? escapeHtml(
        language === 'en'
          ? `${item.title.trim()} — final edit`
          : `${item.title.trim()} — תוצאה סופית`
      )
    : escapeHtml(copy.statusEdited)

  return `
<section
  class="comparison-section"
  id="ba-${escapeHtml(item.id)}"
  data-comparison-section
  data-comparison-id="${escapeHtml(item.id)}"
>
  <div class="comparison-layout">
    <div class="comparison-content">
      <p class="comparison-tag">${escapeHtml(copy.tag)}</p>
      <div class="comparison-number-row" aria-hidden="true">
        <span class="comparison-number">${padIndex(index)}</span>
        <span class="comparison-number-line"></span>
      </div>
      ${hasTitle ? `<h2 class="comparison-title ${titleClass}">${escapeHtml(item.title!.trim())}</h2>` : ''}
      ${hasDescription ? `<p class="comparison-desc">${escapeHtml(item.description!.trim())}</p>` : ''}
      <p class="comparison-howto">${escapeHtml(copy.howTo)}</p>
      <button
        type="button"
        class="comparison-toggle"
        data-comparison-toggle
        aria-pressed="false"
        disabled
      >${escapeHtml(copy.showOriginal)}</button>
    </div>

    <div class="comparison-media">
      <div
        class="comparison-frame"
        data-comparison-frame
        data-comparison-id="${escapeHtml(item.id)}"
        tabindex="0"
        role="application"
        aria-label="${escapeHtml(copy.regionLabel)}"
        data-label-show-original="${escapeHtml(copy.showOriginal)}"
        data-label-show-result="${escapeHtml(copy.showResult)}"
        data-label-status-edited="${escapeHtml(copy.statusEdited)}"
        data-label-status-original="${escapeHtml(copy.statusOriginal)}"
      >
        <div class="comparison-skeleton" aria-hidden="true"></div>
        <div class="comparison-error" aria-hidden="true">${escapeHtml(copy.loadError)}</div>
        <img
          class="comparison-image comparison-image--edited"
          data-edited-image
          data-edited-img
          src="${escapeHtml(item.editedImageUrl)}"
          alt="${alt}"
          loading="${loading}"
          decoding="async"
        />
        <div class="comparison-original-layer" data-original-layer aria-hidden="true">
          <img
            class="comparison-image comparison-image--original"
            data-original-image
            data-original-img
            src="${escapeHtml(item.originalImageUrl)}"
            alt=""
            loading="${loading}"
            decoding="async"
            aria-hidden="true"
          />
        </div>
        <div class="comparison-lens" data-comparison-lens aria-hidden="true">
          <span>${escapeHtml(copy.lensLabel)}</span>
        </div>
        <span
          class="comparison-missing-original"
          data-comparison-missing-original
          hidden
        >${escapeHtml(copy.missingOriginal)}</span>
      </div>
      <span class="comparison-status" data-comparison-status>${escapeHtml(copy.statusEdited)}</span>
    </div>
  </div>
</section>`
}

function pageHead(
  theme: SiteChromeTheme,
  studioName: string,
  primaryColor: string,
  pageTitle: string,
  shouldColorLogo: boolean,
  siteLanguage?: string | null
) {
  const t = TOKENS[theme]
  const title = escapeHtml(`${pageTitle} | ${studioName}`)
  const ltrCss = publicSiteLtrCss(siteLanguage)
  return `
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${title}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "${primaryColor}",
        accent: "${primaryColor}",
        background: "${t.bg}",
        surface: "${t.surface}",
        "on-surface": "${t.text}",
        "on-surface-variant": "${t.variant}",
        "outline-variant": "${t.outline}",
      },
      spacing: { xs: "8px", sm: "12px", md: "16px", lg: "24px", xl: "32px", xxl: "80px", "margin-mobile": "16px", "margin-desktop": "64px" },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Heebo", "sans-serif"],
        "serif-hebrew": ["Frank Ruhl Libre", "serif"],
        headline: ["Space Grotesk", "Heebo", "sans-serif"],
      },
    },
  },
};
</script>
<style>
body { font-family: 'Heebo', sans-serif; background: ${t.bg}; color: ${t.text}; }
.font-serif-hebrew { font-family: 'Frank Ruhl Libre', serif; }
.font-headline { font-family: 'Space Grotesk', 'Heebo', sans-serif; }
:root {
  --ba-frame-bg: ${t.frameBg};
  --brand-primary: ${primaryColor};
  --theme-image-radius: ${t.imageRadius};
  --theme-card-radius: ${t.imageRadius};
  --theme-card-shadow: ${t.cardShadow};
  --theme-border-color: ${t.outline};
  --theme-muted-background: ${t.frameBg};
  --theme-card-background: ${t.surface};
}
${REVEAL_LENS_CSS}
${generateSiteNavStyles(theme, primaryColor, shouldColorLogo)}
${ltrCss}
</style>
</head>
<body class="bg-background text-on-surface overflow-x-hidden">`
}

export function generatePublicBeforeAfterPageHTML(options: {
  theme: PhotographerSiteTheme
  studioName: string
  logoUrl: string | null
  homepagePath: string
  beforeAfterPath: string
  blogPath?: string
  page: PublicBeforeAfterPageData
  hasFaq?: boolean
  hasPackages?: boolean
  hasBlog?: boolean
  shouldColorLogo?: boolean
  galleryLayoutMode?: 'separated' | 'portfolio'
  portfolioPath?: string
  siteLanguage?: string | null
}) {
  const chromeTheme = toChromeTheme(options.theme)
  const primaryColor = options.page.accentColor
  const language = resolveSiteLanguage(options.siteLanguage)
  const titleClass = titleFontClass(chromeTheme)
  const copy = pageCopy(language)

  const chrome = buildPublicSiteChrome({
    theme: chromeTheme,
    studioName: options.studioName,
    logoUrl: options.logoUrl,
    primaryColor,
    homepagePath: options.homepagePath,
    linkMode: 'href',
    hasFaq: options.hasFaq ?? false,
    hasPackages: options.hasPackages ?? false,
    hasBlog: options.hasBlog ?? false,
    blogPath: options.blogPath,
    hasPhotoEditComparisons: true,
    beforeAfterPath: options.beforeAfterPath,
    shouldColorLogo: options.shouldColorLogo ?? false,
    galleryLayoutMode: options.galleryLayoutMode ?? 'separated',
    portfolioPath: options.portfolioPath,
    siteLanguage: options.siteLanguage,
  })

  const itemsHtml = options.page.items
    .map((item, index) => renderComparisonSection(item, index, language, titleClass))
    .join('\n')

  return `<!DOCTYPE html>
<html ${publicSitePageHtmlAttrs(options.siteLanguage)} style="scroll-behavior: smooth;">
${pageHead(chromeTheme, options.studioName, primaryColor, options.page.pageTitle, options.shouldColorLogo ?? false, options.siteLanguage)}
${generateSiteNav(chrome)}
<main class="ba-page">
  <header class="ba-header">
    <span class="ba-header__eyebrow">${escapeHtml(copy.eyebrow)}</span>
    <h1 class="${titleClass}">${escapeHtml(options.page.pageTitle)}</h1>
    <p>${escapeHtml(options.page.intro)}</p>
  </header>
  <div class="ba-list">
    ${itemsHtml}
  </div>
</main>
${generateSiteFooter(chrome)}
<script>${generateSiteNavScrollScript(chromeTheme, 'href')}</script>
<script>${REVEAL_LENS_SCRIPT}</script>
</body>
</html>`
}
