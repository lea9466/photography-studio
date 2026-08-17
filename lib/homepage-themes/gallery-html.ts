import type { Gallery } from '@/lib/homepage-themes/types'
import { generateHomepageMoreLinkHTML } from '@/lib/homepage-posts-section'
import { contentDirAttr, galleryCardArrow, getSiteChromeCopy, type SiteLanguage } from '@/lib/site-language'

function takeHomepageGalleries(galleries: Gallery[]): Gallery[] {

  return galleries.slice(0, 4)

}



type GalleryThemeVariant = 'elegant' | 'modern' | 'classic' | 'dark'



const GALLERY_RADIUS_BY_THEME: Record<GalleryThemeVariant, string> = {

  elegant: '0px',

  modern: '12px',

  classic: '4px',

  dark: '0px',

}



function escapeGalleryText(value: string): string {

  return value

    .replace(/&/g, '&amp;')

    .replace(/"/g, '&quot;')

    .replace(/'/g, '&#39;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

}



export function generateUnifiedGalleryGridHTML(

  galleries: Gallery[],

  themeVariant: GalleryThemeVariant,

  language: SiteLanguage = 'he',

): string {

  const display = takeHomepageGalleries(galleries)

  if (display.length === 0) return ''



  const radius = GALLERY_RADIUS_BY_THEME[themeVariant]



  return display

    .map((g) => {

      const year = new Date(g.created_at).getFullYear()

      const galleryUrl = `/public-gallery/${g.id}`

      const title = escapeGalleryText(String(g.title))

      const preview = g.preview_url

      const previewHtml = preview

        ? `<div class="homepage-gallery-card-media"><img alt="${title}" class="homepage-gallery-card-image" src="${preview}" loading="eager" decoding="async" fetchpriority="high" /></div>`

        : ''



      const seriesLabel = getSiteChromeCopy(language).gallerySeriesLabel
      const viewCta = getSiteChromeCopy(language).galleryViewCta
      const arrow = galleryCardArrow(language)
      const cardDir = contentDirAttr(language)

      return `<a href="${galleryUrl}" target="_parent" class="homepage-gallery-card group" style="border-radius: ${radius}">

${previewHtml}

<div class="homepage-gallery-card-overlay"></div>

<div class="homepage-gallery-card-content" ${cardDir}>

<p class="homepage-gallery-card-label">${seriesLabel}</p>

<h3 class="homepage-gallery-card-title">${title}</h3>

<p class="homepage-gallery-card-subtitle">${year}</p>

<span class="homepage-gallery-card-cta"><span class="homepage-gallery-card-arrow">${arrow}</span> ${viewCta}</span>

</div>

</a>`

    })

    .join('')

}



function pickRowPhotos(pool: string[], offset: number, count: number): string[] {

  if (pool.length === 0) return []

  const result: string[] = []

  for (let i = 0; i < count; i++) {

    result.push(pool[(offset + i) % pool.length])

  }

  return result

}



export function generateRecentPhotosGridHTML(

  galleries: Gallery[],

  themeVariant: 'elegant' | 'modern' | 'classic' | 'dark'

): string {

  const withPhotos = galleries.filter((g) => (g.photo_pool?.length ?? 0) > 0)

  if (withPhotos.length === 0) return ''



  const rows = takeHomepageGalleries(withPhotos)

  let cellIndex = 0

  const rowsHtml = rows

    .map((g) => {

      const pool = g.photo_pool ?? []

      const photos = pickRowPhotos(pool, 0, 4)

      const title = String(g.title)

        .replace(/&/g, '&amp;')

        .replace(/"/g, '&quot;')

        .replace(/'/g, '&#39;')

        .replace(/</g, '&lt;')

        .replace(/>/g, '&gt;')



      return photos

        .map((src) => {

          const delay = (cellIndex % 4) * 90

          cellIndex++

          // Remove link functionality for performance - images display faster without links

          return `

<div class="recent-photo-cell" data-reveal-delay="${delay}" aria-label="${title}">

  <img alt="${title}" class="recent-photo-img" src="${src}" loading="lazy" decoding="async" fetchpriority="low" />

</div>`

        })

        .join('')

    })

    .join('')



  return rowsHtml

}



export function generatePortfolioCtaHTML(

  portfolioPath: string,

  primaryColor: string,

  language: SiteLanguage = 'he',

): string {

  return `

<div class="portfolio-cta-wrap">

${generateHomepageMoreLinkHTML({

  href: portfolioPath,

  label: getSiteChromeCopy(language).viewAllPhotos,

  primaryColor,

  includeStyles: true,

  language,

})}

</div>`

}


