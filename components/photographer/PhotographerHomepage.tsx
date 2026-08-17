'use client'

import { useEffect, useRef, useState } from 'react'
import { readHomepageInitialSection } from '@/lib/photographer-site-paths'
import type { PublicBlogPost } from '@/lib/public-blog-html'
import type { Photographer, Gallery, Package, Testimonial } from '@/lib/homepage-themes/types'
import { generateHomepageHTML } from '@/lib/homepage-themes/generate-homepage-html'

interface PhotographerHomepageProps {
  photographer: Photographer
  galleries?: Gallery[]
  packages?: Package[]
  testimonials?: Testimonial[]
  postCount?: number
  photoEditComparisonsCount?: number
  blogPath?: string
  portfolioPath?: string
  studioPath?: string
  posts?: PublicBlogPost[]
}

export function PhotographerHomepage({ photographer, galleries = [], packages = [], testimonials = [], postCount = 0, photoEditComparisonsCount = 0, blogPath, portfolioPath, studioPath, posts = [] }: PhotographerHomepageProps) {
  const [mounted, setMounted] = useState(false)
  const [html, setHtml] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setMounted(true)
    const themeMap: Record<string, string> = {
      'elegant': 'elegant',
      'modern': 'modern',
      'classic': 'classic',
      'bold': 'dark',
      'dark': 'dark',
    }

    const theme = themeMap[photographer.selected_theme] || 'elegant'
    const initialSection = readHomepageInitialSection(window.location.search, window.location.hash)
    const generatedHtml = generateHomepageHTML(
      photographer,
      theme,
      galleries,
      packages,
      testimonials,
      initialSection,
      postCount,
      blogPath,
      portfolioPath,
      studioPath,
      posts,
      window.location.origin,
      photoEditComparisonsCount
    )
    setHtml(generatedHtml)
  }, [photographer, galleries, packages, testimonials, postCount, photoEditComparisonsCount, blogPath, portfolioPath, studioPath, posts])

  if (!mounted) {
    return (
      <main>
        <div style={{ padding: '20px' }}>Loading...</div>
      </main>
    )
  }

  if (!html) {
    return (
      <main>
        <div style={{ padding: '20px' }}>No HTML generated</div>
      </main>
    )
  }

  return (
    <main>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        // allow-same-origin is required so the contact form's same-origin
        // fetch('/api/contact-inquiry', ...) (JSON body) doesn't hit a CORS
        // preflight failure against an opaque/null origin. Note this
        // combination (allow-scripts + allow-same-origin) is documented by
        // MDN as substantially weakening iframe isolation — it does not by
        // itself stop an injected inline script from reading this
        // document's cookies/storage. allow-top-navigation-by-user-activation
        // (not the unrestricted allow-top-navigation) permits the real
        // gallery-card links (target="_parent") to work on genuine clicks,
        // while still blocking a script from silently redirecting the tab.
        // allow-forms is required even though contactFormSubmitScript() calls
        // e.preventDefault() on the 'submit' event: the sandboxed-forms
        // restriction is enforced by the browser's form-submission algorithm
        // itself (confirmed via manual testing — "Blocked form submission...
        // the 'allow-forms' permission is not set"), independent of whether
        // the JS handler cancels the event. allow-forms only lifts that one
        // restriction; it does not grant same-origin access and has no
        // effect on cookie/storage isolation (that is solely gated by
        // allow-same-origin, above).
        sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-by-user-activation"
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title="Photographer Homepage"
      />
    </main>
  )
}
