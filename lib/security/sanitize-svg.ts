/**
 * Strips the known-dangerous constructs from an uploaded SVG before it's
 * stored and served back with `image/svg+xml` (a browser executes scripts
 * in an SVG opened as a top-level document, unlike an `<img>`-embedded one).
 * Also removes DOCTYPE/ENTITY declarations, which some SVG rasterizers
 * (e.g. librsvg via sharp) can resolve as external references.
 *
 * This is a targeted denylist, not a full XML-aware sanitizer — good enough
 * to neutralize the standard SVG-XSS payloads without a new dependency or
 * rejecting legitimate vector logos.
 */
export function sanitizeSvg(raw: string): string {
  let svg = raw

  // <script>...</script> (including malformed/unclosed variants)
  svg = svg.replace(/<script[^>]*>[\s\S]*?<\/script\s*>/gi, '')
  svg = svg.replace(/<script\b[^>]*\/?>/gi, '')

  // Event-handler attributes: onload="...", onclick='...', etc.
  svg = svg.replace(/\son\w+\s*=\s*"(?:[^"]|\\")*"/gi, '')
  svg = svg.replace(/\son\w+\s*=\s*'(?:[^']|\\')*'/gi, '')

  // <foreignObject> can embed arbitrary (X)HTML, including <script>.
  svg = svg.replace(/<foreignObject[^>]*>[\s\S]*?<\/foreignObject\s*>/gi, '')
  svg = svg.replace(/<foreignObject\b[^>]*\/?>/gi, '')

  // Other active-content elements with no legitimate use inside an SVG logo.
  svg = svg.replace(/<(iframe|embed|object)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
  svg = svg.replace(/<(iframe|embed|object)\b[^>]*\/?>/gi, '')

  // javascript:/data: URIs in href/xlink:href.
  svg = svg.replace(
    /((?:xlink:)?href\s*=\s*)"(?:\s*javascript:|\s*data:text\/html)[^"]*"/gi,
    '$1""'
  )
  svg = svg.replace(
    /((?:xlink:)?href\s*=\s*)'(?:\s*javascript:|\s*data:text\/html)[^']*'/gi,
    "$1''"
  )

  // DOCTYPE/ENTITY declarations — not needed for a static vector image and
  // can be used for entity-expansion/external-reference tricks in some parsers.
  svg = svg.replace(/<!DOCTYPE[^>]*>/gi, '')
  svg = svg.replace(/<!ENTITY[^>]*>/gi, '')

  return svg
}
