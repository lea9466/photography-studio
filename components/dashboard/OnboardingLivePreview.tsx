'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { ClassicHomePage } from '@/components/photographer/themes/classic/ClassicHomePage'
import { ClassicSiteHeader } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import { buildHomepageViewModel } from '@/lib/public-site/adapters/build-homepage-view-model'
import {
  toClassicHomePageProps,
  toClassicSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/classic'

// The site is rendered at a desktop width and scaled down to fit the pane.
const DESIGN_WIDTH = 1280

type OnboardingLivePreviewProps = {
  studioName: string
  /** Undefined until a studio name produced a slug — the site "appears" then. */
  slug: string | null
  accentColor: string
  aboutText: string
  heroUrl: string | null
  logoUrl: string | null
}

/**
 * The studio's real public homepage (Classic theme — the default for every new
 * studio), driven by the modal's local draft state so every field shows up as
 * she fills it in. Non-interactive; nothing here touches the server.
 */
export function OnboardingLivePreview({
  studioName,
  slug,
  accentColor,
  aboutText,
  heroUrl,
  logoUrl,
}: OnboardingLivePreviewProps) {
  // The header treats "current path === homepage path" as its transparent-over-hero
  // state, so the preview claims the dashboard path as its homepage.
  const pathname = usePathname() ?? '/'
  const frameRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.45)
  const [contentHeight, setContentHeight] = useState(0)

  useLayoutEffect(() => {
    const frame = frameRef.current
    const content = contentRef.current
    if (!frame || !content) return

    const measureWidth = () => setScale(frame.clientWidth / DESIGN_WIDTH)
    const measureHeight = () => setContentHeight(content.offsetHeight)
    measureWidth()
    measureHeight()

    const observer = new ResizeObserver(() => {
      measureWidth()
      measureHeight()
    })
    observer.observe(frame)
    observer.observe(content)
    return () => observer.disconnect()
  }, [slug])

  const { homePageProps, headerProps } = useMemo(() => {
    const viewModel = buildHomepageViewModel({
      photographer: {
        id: 'onboarding-preview',
        name: studioName,
        studio_name: studioName,
        slug: slug ?? '',
        logo_url: logoUrl,
        should_color_logo: false,
        accent_color: accentColor,
        heading_font: null,
        about_title_font: null,
        site_language: 'he',
        gallery_layout_mode: null,
        hero_desktop_urls: heroUrl ? [heroUrl] : [],
        hero_mobile_urls: heroUrl ? [heroUrl] : [],
        hero_video_url: null,
        about_text: aboutText || null,
        about_title: null,
        about_subtitle: null,
        about_description: null,
        about_image_url: null,
        stat_clients: null,
        stat_projects: null,
        stat_experience_years: null,
        galleries_title: null,
        recent_photos_title: null,
        posts_page_title: null,
        posts_display_style: null,
        // Only the hero shows in the preview; empty sections would look broken.
        homepage_sections: [
          { id: 'about', visible: false },
          { id: 'galleries', visible: false },
          { id: 'recent_photos', visible: false },
          { id: 'posts', visible: false },
          { id: 'packages', visible: false },
          { id: 'testimonials', visible: false },
          { id: 'faq', visible: false },
        ],
        packages_title: null,
        packages_subtitle: null,
        testimonials_title: null,
        testimonial_layout_type: null,
        faq_items: [],
        faq_section_image_url: null,
        phone: null,
        email: null,
        address: null,
        contact_title: null,
        contact_subtitle: null,
        contact_desktop_url: null,
        contact_mobile_url: null,
      },
      galleries: [],
      packages: [],
      testimonials: [],
      posts: [],
      homepagePath: pathname,
      blogPath: '#',
      portfolioPath: '#',
      beforeAfterPath: '#',
      hasFaq: false,
      postCount: 0,
      photoEditComparisonsCount: 0,
    })
    return {
      homePageProps: toClassicHomePageProps(viewModel),
      headerProps: toClassicSiteHeaderProps(viewModel),
    }
  }, [studioName, slug, accentColor, aboutText, heroUrl, logoUrl, pathname])

  const address = slug
    ? `${typeof window !== 'undefined' ? window.location.host : ''}/${slug}`
    : null

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-black/10 bg-[#f3f1ee] shadow-sm">
      <div className="flex shrink-0 items-center gap-3 border-b border-black/10 bg-white px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff6159]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c940]" />
        </div>
        <div
          dir="ltr"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1 text-xs text-black/60"
        >
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">{address ?? '...'}</span>
        </div>
      </div>

      <div ref={frameRef} dir="ltr" className="relative min-h-0 flex-1 overflow-hidden">
        {slug ? (
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden>
            <div style={{ height: contentHeight * scale }}>
              <div
                ref={contentRef}
                dir="rtl"
                style={{
                  width: DESIGN_WIDTH,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <ClassicSiteHeader {...headerProps} />
                <ClassicHomePage {...homePageProps} />
              </div>
            </div>
          </div>
        ) : (
          <div
            dir="rtl"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-black/45"
          >
            <Globe className="h-10 w-10" />
            <p className="text-lg font-medium">האתר שלך יופיע כאן</p>
            <p className="text-sm">מתחילים בשם העסק, והכתובת והאתר נבנים מיד.</p>
          </div>
        )}
      </div>
    </div>
  )
}
