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
}

const TOKENS: Record<SiteChromeTheme, ThemeTokens> = {
  elegant: {
    bg: '#FAFAF8',
    surface: '#fdf8f7',
    text: '#1c1b1b',
    variant: '#464742',
    outline: '#c7c7c0',
    frameBg: 'rgba(28, 27, 27, 0.035)',
  },
  classic: {
    bg: '#FAFAF8',
    surface: '#ffffff',
    text: '#1c1917',
    variant: '#57534e',
    outline: '#d6d3d1',
    frameBg: 'rgba(28, 25, 23, 0.035)',
  },
  modern: {
    bg: '#F8FAFC',
    surface: '#ffffff',
    text: '#0F172A',
    variant: '#475569',
    outline: '#cbd5e1',
    frameBg: 'rgba(15, 23, 42, 0.035)',
  },
  dark: {
    bg: '#121217',
    surface: '#1A1A22',
    text: '#F5F5F0',
    variant: '#B8B8C0',
    outline: 'rgba(255,255,255,0.12)',
    frameBg: 'rgba(255, 255, 255, 0.04)',
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
    regionLabel: he
      ? 'עדשת חשיפה — הזיזו כדי לראות את המקור'
      : 'Reveal lens — move to see the original',
  }
}

const REVEAL_LENS_CSS = `
.ba-page {
  padding-top: 5.5rem;
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
  margin-bottom: 0.65rem;
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
  display: flex;
  flex-direction: column;
  gap: clamp(2.5rem, 6vh, 4.5rem);
  max-width: 1180px;
  margin: 0 auto;
  padding-inline: 1rem;
}
.comparison-section {
  min-height: auto;
  max-width: 1180px;
  margin-inline: auto;
  padding-block: clamp(32px, 5vh, 64px);
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.comparison-section.is-visible {
  opacity: 1;
  transform: none;
}
.comparison-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.45fr);
  align-items: center;
  gap: clamp(32px, 5vw, 72px);
}
.comparison-content {
  text-align: start;
  min-width: 0;
}
.comparison-tag {
  display: inline-block;
  margin: 0 0 0.85rem;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.5;
}
.comparison-number {
  margin: 0 0 0.85rem;
  font-size: clamp(42px, 5vw, 72px);
  line-height: 1;
  opacity: 0.14;
  font-weight: 500;
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
  min-width: 0;
  position: relative;
}
.comparison-frame {
  position: relative;
  width: 100%;
  height: min(68vh, 620px);
  min-height: 380px;
  max-height: 620px;
  border-radius: 20px;
  overflow: hidden;
  background: var(--ba-frame-bg, rgba(0, 0, 0, 0.035));
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.1);
  touch-action: pan-y;
  outline: none;
  --lens-x: 50%;
  --lens-y: 50%;
  --lens-radius: 105px;
  cursor: crosshair;
}
.comparison-frame.is-dragging {
  touch-action: none;
}
.comparison-frame:focus-visible {
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(255,255,255,0.85),
    0 0 0 4px rgba(0,0,0,0.28);
}
@media (max-height: 760px) and (min-width: 900px) {
  .comparison-frame {
    height: min(62vh, 520px);
    min-height: 340px;
    --lens-radius: 90px;
  }
}
.comparison-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}
.comparison-image--edited {
  z-index: 1;
}
.comparison-original-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  /* clip-path is more reliable than mask + CSS vars across browsers */
  clip-path: circle(var(--lens-radius) at var(--lens-x) var(--lens-y));
  -webkit-clip-path: circle(var(--lens-radius) at var(--lens-x) var(--lens-y));
  opacity: 0;
  transition: opacity 0.2s ease;
}
.comparison-frame.is-ready:not(.show-full-original).is-interacting .comparison-original-layer,
.comparison-frame.is-ready:not(.show-full-original).is-touch .comparison-original-layer {
  opacity: 1;
}
.comparison-frame.show-full-original .comparison-original-layer {
  clip-path: none;
  -webkit-clip-path: none;
  opacity: 1;
  transition: opacity 0.3s ease;
}
.comparison-frame.show-full-original .comparison-lens,
.comparison-frame:not(.is-ready) .comparison-lens,
.comparison-frame.is-edited-only .comparison-lens,
.comparison-frame.is-error .comparison-lens {
  opacity: 0;
  visibility: hidden;
}
.comparison-lens {
  position: absolute;
  z-index: 4;
  left: var(--lens-x);
  top: var(--lens-y);
  width: calc(var(--lens-radius) * 2);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    0 12px 35px rgba(0, 0, 0, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.14), transparent 55%);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}
.comparison-frame.is-ready:not(.show-full-original).is-interacting .comparison-lens,
.comparison-frame.is-ready:not(.show-full-original).is-touch .comparison-lens {
  opacity: 1;
  visibility: visible;
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
  z-index: 5;
  inset-inline-start: 0.9rem;
  top: 0.85rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.comparison-frame.is-ready .comparison-status {
  opacity: 0.9;
}
.comparison-skeleton {
  position: absolute;
  inset: 0;
  z-index: 6;
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
.comparison-frame.is-edited-only .comparison-skeleton {
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
  background: var(--ba-frame-bg, rgba(0, 0, 0, 0.035));
}
.comparison-frame.is-error .comparison-error {
  display: flex;
}
@media (max-width: 850px) {
  .comparison-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .comparison-content { order: 1; }
  .comparison-media { order: 2; }
  .comparison-frame {
    height: min(62vh, 520px);
    min-height: 320px;
    max-height: 520px;
    --lens-radius: 78px;
  }
  .comparison-number {
    font-size: clamp(36px, 12vw, 56px);
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

  function bootFrame(frame) {
    var section = frame.closest('[data-comparison-id]');
    var originalLayer = frame.querySelector('[data-original-layer]');
    var lens = frame.querySelector('[data-comparison-lens]');
    var editedImg = frame.querySelector('[data-edited-img]');
    var originalImg = frame.querySelector('[data-original-img]');
    var statusEl = frame.querySelector('[data-comparison-status]');
    var toggleBtn = section ? section.querySelector('[data-comparison-toggle]') : null;
    var showOriginalLabel = frame.getAttribute('data-label-show-original') || '';
    var showResultLabel = frame.getAttribute('data-label-show-result') || '';
    var statusEdited = frame.getAttribute('data-label-status-edited') || '';
    var statusOriginal = frame.getAttribute('data-label-status-original') || '';

    if (!originalLayer || !lens || !editedImg || !originalImg) return;

    var loaded = { edited: false, original: false };
    var failed = { edited: false, original: false };
    var dragging = false;
    var pending = null;
    var showingOriginal = false;

    function setLens(clientX, clientY) {
      var rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = clamp(clientX - rect.left, 0, rect.width);
      var y = clamp(clientY - rect.top, 0, rect.height);
      frame.style.setProperty('--lens-x', ((x / rect.width) * 100).toFixed(3) + '%');
      frame.style.setProperty('--lens-y', ((y / rect.height) * 100).toFixed(3) + '%');
    }

    function setReadyState() {
      if (failed.edited) {
        frame.classList.add('is-error');
        frame.classList.remove('is-ready');
        if (toggleBtn) toggleBtn.disabled = true;
        return;
      }
      if (!loaded.edited) return;

      if (failed.original) {
        frame.classList.add('is-edited-only', 'is-ready');
        if (toggleBtn) toggleBtn.disabled = true;
        if (statusEl) statusEl.textContent = statusEdited;
        return;
      }
      if (!loaded.original) return;

      frame.classList.add('is-ready');
      if (coarse) frame.classList.add('is-touch');
      if (toggleBtn) toggleBtn.disabled = false;
      if (statusEl) statusEl.textContent = statusEdited;
      frame.style.setProperty('--lens-x', '50%');
      frame.style.setProperty('--lens-y', '50%');
    }

    function beginDrag(event) {
      if (!frame.classList.contains('is-ready') || showingOriginal || failed.original) return;
      dragging = true;
      pending = null;
      frame.classList.add('is-dragging', 'is-interacting');
      try { frame.setPointerCapture(event.pointerId); } catch (e) {}
      setLens(event.clientX, event.clientY);
    }

    function onPointerDown(event) {
      if (!frame.classList.contains('is-ready') || showingOriginal || failed.original) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.pointerType === 'touch' || coarse) {
        pending = { id: event.pointerId, x: event.clientX, y: event.clientY };
        return;
      }
      beginDrag(event);
      event.preventDefault();
    }

    function onPointerMove(event) {
      if (!frame.classList.contains('is-ready') || showingOriginal || failed.original) return;

      if (pending && event.pointerId === pending.id) {
        var dx = event.clientX - pending.x;
        var dy = event.clientY - pending.y;
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          pending = null;
          return;
        }
        beginDrag(event);
        event.preventDefault();
        return;
      }

      if (dragging) {
        setLens(event.clientX, event.clientY);
        event.preventDefault();
        return;
      }

      if (event.pointerType === 'mouse' && !coarse) {
        frame.classList.add('is-interacting');
        setLens(event.clientX, event.clientY);
      }
    }

    function onPointerUp(event) {
      pending = null;
      if (!dragging) return;
      dragging = false;
      frame.classList.remove('is-dragging');
      try { frame.releasePointerCapture(event.pointerId); } catch (e) {}
    }

    function onPointerEnter() {
      if (!frame.classList.contains('is-ready') || showingOriginal || failed.original) return;
      frame.classList.add('is-interacting');
    }

    function onPointerLeave() {
      if (dragging) return;
      frame.classList.remove('is-interacting');
    }

    function onKeyDown(event) {
      if (!frame.classList.contains('is-ready') || showingOriginal || failed.original) return;
      var rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var stepX = rect.width * (event.shiftKey ? 0.08 : 0.03);
      var stepY = rect.height * (event.shiftKey ? 0.08 : 0.03);
      var x = (parseFloat(frame.style.getPropertyValue('--lens-x')) || 50) / 100 * rect.width;
      var y = (parseFloat(frame.style.getPropertyValue('--lens-y')) || 50) / 100 * rect.height;
      var handled = true;
      if (event.key === 'ArrowLeft') x -= stepX;
      else if (event.key === 'ArrowRight') x += stepX;
      else if (event.key === 'ArrowUp') y -= stepY;
      else if (event.key === 'ArrowDown') y += stepY;
      else handled = false;
      if (!handled) return;
      event.preventDefault();
      frame.classList.add('is-interacting');
      setLens(rect.left + x, rect.top + y);
    }

    if (toggleBtn) {
      toggleBtn.disabled = true;
      toggleBtn.addEventListener('click', function () {
        if (!frame.classList.contains('is-ready') || failed.original) return;
        showingOriginal = frame.classList.toggle('show-full-original');
        toggleBtn.setAttribute('aria-pressed', showingOriginal ? 'true' : 'false');
        toggleBtn.textContent = showingOriginal ? showResultLabel : showOriginalLabel;
        if (statusEl) {
          statusEl.textContent = showingOriginal ? statusOriginal : statusEdited;
        }
        if (showingOriginal) {
          frame.classList.remove('is-interacting');
        }
      });
    }

    frame.addEventListener('pointerdown', onPointerDown);
    frame.addEventListener('pointermove', onPointerMove);
    frame.addEventListener('pointerup', onPointerUp);
    frame.addEventListener('pointercancel', onPointerUp);
    frame.addEventListener('pointerenter', onPointerEnter);
    frame.addEventListener('pointerleave', onPointerLeave);
    frame.addEventListener('keydown', onKeyDown);

    function bindImage(img, key) {
      var mark = function (ok) {
        if (ok) loaded[key] = true;
        else failed[key] = true;
        setReadyState();
      };
      if (img.complete) {
        mark(img.naturalWidth > 0);
      } else {
        img.addEventListener('load', function () { mark(true); });
        img.addEventListener('error', function () { mark(false); });
      }
    }

    bindImage(editedImg, 'edited');
    bindImage(originalImg, 'original');
  }

  function boot() {
    document.querySelectorAll('[data-comparison-frame]').forEach(bootFrame);

    var sections = document.querySelectorAll('[data-comparison-id]');
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
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
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
  data-comparison-id="${escapeHtml(item.id)}"
>
  <div class="comparison-layout">
    <div class="comparison-content">
      <p class="comparison-tag">${escapeHtml(copy.tag)}</p>
      <p class="comparison-number" aria-hidden="true">${padIndex(index)}</p>
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
        tabindex="0"
        role="application"
        aria-label="${escapeHtml(copy.regionLabel)}"
        data-label-show-original="${escapeHtml(copy.showOriginal)}"
        data-label-show-result="${escapeHtml(copy.showResult)}"
        data-label-status-edited="${escapeHtml(copy.statusEdited)}"
        data-label-status-original="${escapeHtml(copy.statusOriginal)}"
      >
        <div class="comparison-skeleton" aria-hidden="true"></div>
        <div class="comparison-error">${escapeHtml(copy.loadError)}</div>
        <img
          class="comparison-image comparison-image--edited"
          data-edited-img
          src="${escapeHtml(item.editedImageUrl)}"
          alt="${alt}"
          loading="${loading}"
          decoding="async"
        />
        <div class="comparison-original-layer" data-original-layer aria-hidden="true">
          <img
            class="comparison-image comparison-image--original"
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
        <span class="comparison-status" data-comparison-status>${escapeHtml(copy.statusEdited)}</span>
      </div>
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
:root { --ba-frame-bg: ${t.frameBg}; }
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
