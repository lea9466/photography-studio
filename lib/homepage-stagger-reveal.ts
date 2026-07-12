export const HOMEPAGE_STAGGER_REVEAL_CSS = `
.stagger-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.75s cubic-bezier(0.2, 0, 0.2, 1), transform 0.75s cubic-bezier(0.2, 0, 0.2, 1);
  will-change: opacity, transform;
}
.stagger-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.homepage-package-reveal {
  width: 100%;
  min-width: 0;
}
`

export const HOMEPAGE_STAGGER_REVEAL_SCRIPT = `
(function initStaggerReveal() {
  if (window.__homepageStaggerRevealInit) return;
  window.__homepageStaggerRevealInit = true;
  function boot() {
    var cells = [].slice.call(document.querySelectorAll('.stagger-reveal'));
    if (!cells.length) return;
    if (!('IntersectionObserver' in window)) {
      cells.forEach(function(c) { c.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var cell = entry.target;
        var delay = parseInt(cell.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function() { cell.classList.add('is-visible'); }, delay);
        observer.unobserve(cell);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    cells.forEach(function(c) { observer.observe(c); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`
