/**
 * One-off disclosure badge for a single demo studio ("לתפוס רגעים יפים",
 * slug `lea-studio` — the same site embedded live in the homepage's example
 * showcase, see EXAMPLE_PATH in components/marketing/nova/NovaShowcase.tsx):
 * its photos belong to אילה וויג, not to the studio. Gated by slug in
 * app/[slug]/layout.tsx — not a general feature, so it isn't wired into
 * chromeViewModel/entitlements like the rest of the chrome.
 *
 * Plain `position: absolute` (not fixed) — it scrolls away with the page
 * like any other content instead of staying pinned. Bottom-left of the
 * first screen, not top-left, so it never competes with the logo there;
 * `top: calc(100vh - …)` is what lands it at that corner of the *initial*
 * viewport while still being a normal (scrolls-with-the-page) absolute box
 * — `bottom` can't be used directly since its containing block is
 * ClassicPageChrome's root, which is the full page height, not one screen.
 * ClassicPageChrome's root carries the `relative` that anchors it here, at
 * the page's own top, rather than the first positioned ancestor up the tree.
 *
 * Two offsets, not one: the homepage hero stacks its frosted contact card
 * (name/CTA buttons) over almost the whole lower third of the screen on a
 * narrow phone, where a single desktop-tuned offset landed right on top of
 * the "לצפייה בגלריות" button — measured against this studio's actual hero,
 * so it's an approximation tied to its current content, not a formula.
 *
 * Stays as-is for 2s, then fades out through a blur over 1s and stays gone
 * (`forwards`) — a plain CSS animation, no JS/state needed. The scoped
 * <style> tag (same pattern ClassicPageChrome already uses for its own
 * one-off global rules) keeps the keyframes local to this file instead of
 * adding a shared stylesheet for a single-studio badge.
 */
export function StudioAttributionBanner() {
  return (
    <>
      <style>{`
        @keyframes studio-attribution-fade {
          0% { opacity: 1; filter: blur(0); }
          100% { opacity: 0; filter: blur(8px); pointer-events: none; }
        }
      `}</style>
      <div
        className="absolute left-6 top-[calc(100vh-260px)] z-40 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs text-[#55493a] shadow-md backdrop-blur-sm md:top-[calc(100vh-72px)]"
        style={{ animation: 'studio-attribution-fade 1s ease-out 2s forwards' }}
        role="note"
      >
        התמונות באתר זה שייכות לאילה וויג
      </div>
    </>
  )
}
