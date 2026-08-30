---
name: pure-react-build
description: Conventions for building any new UI in this repo (especially the public-site theme rebuild) as clean, secure, pure React — no string-HTML/dangerouslySetInnerHTML, no direct DOM manipulation, small focused components. Load this whenever asked to build a new component, section, or page.
---

# Pure/secure React build conventions

These are Lea's standing requirements for any new UI in this project, established across the public-site rebuild (`components/photographer/themes/`). Apply them to every new component, not just that rebuild — reload this skill whenever building something new.

## Hard rules

1. **No string-HTML generation, no `dangerouslySetInnerHTML`** — render real JSX. The one case where raw HTML might be legitimate (a genuinely sanitized rich-text field) must be *proven* first: trace the data from its source (DB column, form input) through every step to where it renders, confirm a real sanitizer runs somewhere in that path. If you can't point at the sanitizer, treat it as plain text and render it as JSX text content, not HTML. Don't guess either way — check.
2. **No direct DOM manipulation** — no `document.querySelector`/`getElementById`/etc. reaching outside a component's own render tree. A `ref` to a component's *own* rendered node (e.g. `videoRef.current.play()`, a drag-slider's pointer-state refs) is fine — the ruled-out pattern is reaching into *someone else's* DOM via a selector, not using refs on your own elements. Native browser behavior (`<a href="#section">` anchor scrolling, `<input type="range">` for drag+keyboard) beats a hand-rolled `onClick` + imperative scroll/DOM call.
3. **Small, focused components** — split aggressively. No thousand-line page files. A page-composition component (e.g. `XHomePage.tsx`) should mostly just assemble smaller section components, not contain their internals.
4. **Security at real boundaries** — anything that renders user-supplied content (studio bios, testimonial text, contact-form input, custom domain values, etc.) goes through JSX text interpolation (auto-escaped) or a validated/typed prop, never string-concatenated into HTML or SQL. Validate/sanitize at the actual system boundary (form submit, API route), not defensively everywhere.

## When porting an existing design 1:1

If the task is reproducing an existing visual design (not new UI), CSS fidelity is a separate, equally strict requirement — see [[project_public-site-react-rebuild]] memory for the full convention (CSS Modules per component, literal 1:1 ported values including source cascade quirks, custom runtime-Tailwind-token translation, dynamic per-entity colors as CSS custom properties). Don't reinterpret/approximate CSS when the goal is pixel parity with something already live.

## Shared vs. per-variant code

Don't assume two similar-looking pieces (e.g. the same section across 4 themes) are actually identical — grep the real source for a shared implementation/parameterization (a `themeVariant` param, a shared CSS block) before extracting a shared component. If the old code genuinely branches per variant/theme, keep the new code separate too rather than forcing a shared abstraction that doesn't fit. Confirmed-shared pieces go in a `shared/` folder; everything else stays local to its own variant.

## Verify before calling it done

After building or editing, run `npx tsc --noEmit` (0 new errors) and grep for the two banned patterns (`dangerouslySetInnerHTML`, `document\.(querySelector|getElementById)`) across whatever you just touched. Visual verification (screenshots) is Lea's own step unless she asks otherwise — don't spend tokens on Playwright passes she hasn't requested for a given task.
