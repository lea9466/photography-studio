'use client'



import { useEffect, useRef, useState } from 'react'

import {

  generateHeroSlideshowHTML,

  generateModernHeroFilmBeltHTML,

  HERO_SLIDESHOW_CSS,

  HERO_SLIDESHOW_INIT_SCRIPT,

  MODERN_HERO_FILM_BELT_CSS,

  MODERN_HERO_FILM_INIT_SCRIPT,

  normalizeHeroUrlList,

} from '@/lib/hero-slideshow'

import {

  buildPublicSiteChrome,

  generateSiteFooter,

  generateLogoColoringScript,

  generateSiteNav,

  generateSiteNavMobileStyles,

  generateSiteNavScrollScript,

  type SiteChromeTheme,

} from '@/lib/photographer-site-chrome'

import { parseFaqItems, sanitizeFaqItems, type FaqItem } from '@/lib/faq'

import {

  generateHomepageSectionScrollScript,

  readHomepageInitialSection,

} from '@/lib/photographer-site-paths'

import { resolvePackagesSectionCopy } from '@/lib/packages-section-copy'
import { resolveContactSectionCopy } from '@/lib/contact-section-copy'

import { resolveTestimonialsSectionTitle, resolveTestimonialsSectionSubtitle } from '@/lib/testimonials-section-copy'

import { resolvePostsPageTitle } from '@/lib/posts-section-copy'

import {
  generateHomepageMoreLinkHTML,
  generateHomepagePostsSectionHTML,
} from '@/lib/homepage-posts-section'

import {
  HOMEPAGE_STAGGER_REVEAL_CSS,
  HOMEPAGE_STAGGER_REVEAL_SCRIPT,
} from '@/lib/homepage-stagger-reveal'

import { getBrandingPublicMediaPath } from '@/lib/branding-public-url'
import { getBrandingFaviconStoragePath } from '@/lib/branding/logo-favicon-path'
import { HOMEPAGE_LTR_CSS } from '@/lib/homepage-ltr-css'
import {
  contactLtrDirAttr,
  contactLtrFieldClass,
  contactTextAlignClass,
  getHomepageCopy,
  type HomepageCopy,
} from '@/lib/homepage-copy'
import {
  contentDirAttr,
  galleryCardArrow,
  getSiteChromeCopy,
  resolveSiteLanguage,
  siteHtmlAttrs,
  type SiteLanguage,
} from '@/lib/site-language'
import type { PublicBlogPost } from '@/lib/public-blog-html'
import { buildHomepageBlogModalHeadBlock } from '@/lib/public-blog-html'



interface Photographer {

  id: string

  name: string

  studio_name: string

  logo_url: string | null

  about_text: string | null

  about_title: string | null

  about_subtitle: string | null

  about_description: string | null

  contact_card_title: string | null

  contact_card_description: string | null

  stat_projects: number

  stat_clients: number

  stat_experience_years: number

  accent_color: string

  selected_theme: string

  hero_desktop_url: string | null

  hero_mobile_url: string | null

  hero_desktop_urls?: string[] | null

  hero_mobile_urls?: string[] | null

  about_image_url: string | null

  contact_desktop_url: string | null

  contact_mobile_url: string | null

  packages_desktop_url: string | null

  packages_mobile_url: string | null

  testimonial_layout_type?: string | null
  packages_title: string | null

  packages_subtitle: string | null

  contact_title?: string | null

  contact_subtitle?: string | null

  testimonials_title: string | null

  email: string | null

  phone: string | null

  address: string | null

  faq_items?: FaqItem[] | unknown

  faq_section_image_url?: string | null

  should_color_logo?: boolean

  posts_page_title?: string | null

  gallery_layout_mode?: string | null

  site_language?: string | null

}



interface Gallery {

  id: string

  title: string

  slug: string | null

  preview_url: string | null

  created_at: string

  photographer_slug: string

  photo_pool?: string[] | null

}



interface Package {

  id: string

  name: string

  price_amount: number

  duration_text: string | null

  includes: string[]

  sort_order: number

  is_featured: boolean

}



interface Testimonial {

  id: string

  title: string

  content: string

  shoot_type: string | null

  review_date: string | null

  created_at: string

  is_featured: boolean

  sort_order: number

  image_url: string | null

}



const UNIFIED_GALLERY_GRID_CSS = `

  .homepage-gallery-section {

    width: 100%;

    overflow-x: clip;

    padding-top: 0 !important;

    padding-bottom: 0 !important;

  }

  .homepage-gallery-header {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    margin-bottom: 1rem !important;

    padding-top: calc(1.5rem + 150px);

    padding-inline: 2%;

    text-align: right !important;

    box-sizing: border-box;

  }

  .homepage-gallery-header > div {

    display: flex;

    flex-direction: column;

    align-items: flex-end !important;

    justify-content: flex-start !important;

    text-align: right !important;

    width: 100%;

  }

  .homepage-gallery-header .elegant-section-heading {

    justify-items: end !important;

    text-align: right !important;

  }

  .homepage-gallery-header .text-right,

  .homepage-gallery-header .text-center,

  .recent-photos-header .text-right,

  .recent-photos-header .text-center {

    text-align: right !important;

  }

  @media (min-width: 768px) {

    .homepage-gallery-header {

      padding-top: calc(2rem + 150px);

    }

  }

  .homepage-gallery-grid {

    display: flex;

    flex-wrap: wrap;

    align-items: stretch;

    gap: 3px;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

    background: var(--homepage-gallery-grid-bg, transparent);

  }

  .homepage-gallery-grid.reveal {

    transition-delay: 0.12s;

  }

  .homepage-gallery-reveal {

    opacity: 0;

    transform: translateY(30px);

    transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);

    will-change: opacity, transform;

  }

  .homepage-gallery-reveal.is-visible {

    opacity: 1;

    transform: translateY(0);

  }

  .homepage-gallery-grid.homepage-gallery-reveal {

    transition-delay: 0.12s;

  }

  @media (min-width: 768px) {

    .homepage-gallery-grid {

      flex-wrap: nowrap;

      gap: 4px;

      height: clamp(360px, calc(100svh - 14rem + 30px), 760px);

    }

  }

  .homepage-gallery-card {

    position: relative;

    display: block;

    flex: 1 1 calc(50% - 1.5px);

    min-width: 0;

    height: calc((100vw * 0.96 - 3px) / 2 * 3 / 2);

    max-height: calc(100svh - 14rem + 30px);

    transition: flex 0.5s ease;

    overflow: hidden;

    background: #eae8e5;

    text-decoration: none;

    cursor: pointer;

  }

  .homepage-gallery-card-media {

    position: absolute;

    inset: 0;

  }

  .homepage-gallery-card:hover,

  .homepage-gallery-card:focus-visible {

    flex: 2.5 1 0;

  }

  @media (min-width: 768px) {

    .homepage-gallery-card {

      flex: 1 1 0;

      height: 100%;

      max-height: none;

    }

  }

  .homepage-gallery-card-image {

    position: absolute;

    inset: 0;

    width: 100%;

    height: 100%;

    object-fit: cover;

  }

  .homepage-gallery-card-overlay {

    position: absolute;

    inset: 0;

    background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, transparent 100%);

    opacity: 0;

    transition: opacity 0.5s ease;

  }

  .homepage-gallery-card-content {

    position: absolute;

    left: 0;

    right: 0;

    bottom: 0;

    padding: 1.25rem 1rem;

    color: #fff;

    opacity: 0;

    transform: translateY(12px);

    transition: opacity 0.5s ease, transform 0.5s ease;

    pointer-events: none;

    text-align: right;

  }

  .homepage-gallery-card-label {

    font-size: 10px;

    letter-spacing: 0.35em;

    text-transform: uppercase;

    opacity: 0.85;

  }

  .homepage-gallery-card-title {

    font-size: 1.35rem;

    margin-top: 0.4rem;

    line-height: 1.1;

  }

  @media (min-width: 768px) {

    .homepage-gallery-card-title { font-size: 1.5rem; }

  }

  .homepage-gallery-card-subtitle {

    font-size: 0.8125rem;

    margin-top: 0.35rem;

    opacity: 0.9;

  }

  .homepage-gallery-card-cta {

    display: inline-flex;

    align-items: center;

    gap: 0.4rem;

    margin-top: 0.85rem;

    font-size: 10px;

    letter-spacing: 0.25em;

    text-transform: uppercase;

  }

  .homepage-gallery-card-arrow {

    transition: transform 0.4s ease;

  }

  .homepage-gallery-card:hover .homepage-gallery-card-overlay,

  .homepage-gallery-card:focus-visible .homepage-gallery-card-overlay { opacity: 1; }

  .homepage-gallery-card:hover .homepage-gallery-card-content,

  .homepage-gallery-card:focus-visible .homepage-gallery-card-content {

    opacity: 1;

    transform: translateY(0);

  }

  .homepage-gallery-card:hover .homepage-gallery-card-arrow { transform: translateX(-4px); }

  @media (hover: none) {

    .homepage-gallery-card-overlay { opacity: 0.55; }

    .homepage-gallery-card-content {

      opacity: 1;

      transform: translateY(0);

    }

  }

  @media (prefers-reduced-motion: reduce) {

    .homepage-gallery-reveal {

      opacity: 1;

      transform: none;

      transition: none;

    }

  }

`



const HOMEPAGE_PACKAGES_GRID_CSS = `

  .homepage-packages-grid {

    display: grid;

    grid-template-columns: 1fr;

    gap: 2rem;

    justify-content: center;

    justify-items: stretch;

    align-items: stretch;

    width: 100%;

    margin-inline: auto;

  }

  .homepage-packages-grid > * {

    width: 100%;

    min-width: 0;

  }

  @media (min-width: 768px) and (max-width: 1023px) {

    .homepage-packages-grid {

      grid-template-columns: 1fr !important;

      max-width: 36rem;

    }

  }

  @media (min-width: 1024px) {

    .homepage-packages-grid {

      grid-template-columns: repeat(3, minmax(0, 1fr));

    }

    .homepage-packages-grid--count-1 {

      grid-template-columns: minmax(0, 22rem);

      justify-content: center;

    }

    .homepage-packages-grid--count-2 {

      grid-template-columns: repeat(2, minmax(0, 22rem));

      justify-content: center;

    }

  }

`



const CLASSIC_PACKAGES_ROWS_CSS = `

  .theme-classic .homepage-packages-section, .theme-bold .homepage-packages-section {

    width: 100%;

    max-width: 100%;

    overflow: hidden;

    padding-top: 120px !important;

  }

  .theme-classic .homepage-packages-section {

    background: linear-gradient(
      to bottom,
      #FAFAF8 0%,
      #FAFAF8 56px,
      #FBF9F6 140px,
      #FAF7F4 260px,
      #FAF7F4 calc(100% - 128px),
      #FAFAF8 100%
    );

  }

  .theme-classic .homepage-packages-section__inner, .theme-bold .homepage-packages-section__inner {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: clamp(1.5rem, 5vw, 4rem);

    box-sizing: border-box;

  }

  .theme-classic .homepage-packages-section__header, .theme-bold .homepage-packages-section__header {

    width: 100%;

    text-align: left !important;

    margin-bottom: 2.5rem;

  }

  .theme-classic .homepage-packages-section__header span,
  .theme-bold .homepage-packages-section__header span,

  .theme-classic .homepage-packages-section__header h2,
  .theme-bold .homepage-packages-section__header h2 {

    text-align: left !important;

  }

  .theme-classic .homepage-packages-section__divider, .theme-bold .homepage-packages-section__divider {

    margin-left: 0;

    margin-right: auto;

  }

  .theme-classic .testimonials-section__inner,
  .testimonials-section--modern .testimonials-section__inner,
  .theme-bold .testimonials-section__inner {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: clamp(1.5rem, 5vw, 4rem);

    box-sizing: border-box;

  }

  .theme-classic .testimonials-section__header,
  .testimonials-section--modern .testimonials-section__header,
  .theme-bold .testimonials-section__header {

    width: 100%;

    text-align: left !important;

    margin-bottom: 2.5rem;

  }

  .theme-classic .testimonials-section__header span,
  .testimonials-section--modern .testimonials-section__header span,
  .theme-bold .testimonials-section__header span,

  .theme-classic .testimonials-section__header h2,
  .testimonials-section--modern .testimonials-section__header h2,
  .theme-bold .testimonials-section__header h2 {

    text-align: left !important;

  }

  .theme-classic .testimonials-section__divider,
  .testimonials-section--modern .testimonials-section__divider,
  .theme-bold .testimonials-section__divider {

    margin-left: 0;

    margin-right: auto;

  }

  .theme-classic .faq-section__header {

    width: 100%;

    text-align: left !important;

    margin-bottom: 2.5rem;

    padding-inline: 2%;

    box-sizing: border-box;

  }

  .theme-classic .faq-section__header span,

  .theme-classic .faq-section__header h2,

  .theme-classic .faq-section__header p {

    text-align: left !important;

  }

  .theme-classic .faq-section__divider {

    margin-left: 0;

    margin-right: auto;

  }

  .theme-classic .homepage-packages-rows, .theme-bold .homepage-packages-rows {

    display: flex;

    flex-direction: column;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

  }

  .theme-classic .homepage-packages-row, .theme-bold .homepage-packages-row {

    display: grid;

    grid-template-columns: auto auto 1fr;

    align-items: center;

    column-gap: 0;

    padding: 2rem 0;

    border-bottom: 1px solid #e2e2e2;

    direction: rtl;

    text-align: right;

    width: 100%;

    overflow: visible;

  }

  .theme-classic .homepage-packages-row:last-child, .theme-bold .homepage-packages-row:last-child {

    border-bottom: none;

  }

  .theme-classic .homepage-packages-row--featured, .theme-bold .homepage-packages-row--featured {

    background: rgba(250, 246, 240, 0.88);

    border-radius: 2px;

  }

  .theme-classic .homepage-packages-row__title, .theme-bold .homepage-packages-row__title {

    grid-column: 1;

    justify-self: end;

    flex: 0 0 auto;

    width: auto;

    min-width: 9rem;

    max-width: 14rem;

    text-align: right;

    padding: 0;

    position: relative;

  }

  .theme-classic .homepage-packages-row__title h3,
  .theme-bold .homepage-packages-row__title h3,

  .theme-classic .homepage-packages-row__title p,
  .theme-bold .homepage-packages-row__title p {

    text-align: right;

    direction: rtl;

  }

  .theme-classic .homepage-packages-row__title h3, .theme-bold .homepage-packages-row__title h3 {

    font-weight: 600;

  }

  .theme-classic .homepage-packages-row__badge, .theme-bold .homepage-packages-row__badge {

    position: absolute;

    top: -1.35rem;

    right: 0;

    left: auto;

    display: inline-block;

    background: var(--primary-color, #8b6f5c);

    color: #ffffff;

    padding: 0.2rem 0.65rem;

    font-size: 0.65rem;

    font-weight: 600;

    text-transform: uppercase;

    letter-spacing: 0.08em;

    border-radius: 2px;

    margin-bottom: 0;

    white-space: nowrap;

  }

  .theme-classic .homepage-packages-row__features, .theme-bold .homepage-packages-row__features {

    grid-column: 2;

    justify-self: start;

    margin-inline-start: 5rem;

    flex: 0 0 auto;

    min-width: 0;

    width: 100%;

    max-width: 36rem;

    text-align: right;

    direction: rtl;

  }

  .theme-classic .homepage-packages-row__features-grid, .theme-bold .homepage-packages-row__features-grid {

    display: grid;

    grid-template-columns: repeat(2, minmax(150px, 1fr));

    gap: 12px 24px;

    list-style: none;

    padding: 0;

    margin: 0;

    direction: rtl;

    text-align: right;

    width: 100%;

    max-width: 100%;

  }

  .theme-classic .homepage-packages-row__features-grid li, .theme-bold .homepage-packages-row__features-grid li {

    display: flex;

    align-items: center;

    justify-content: flex-start;

    gap: 8px;

    direction: rtl;

    text-align: right;

    font-size: 0.9rem;

    color: rgba(45, 40, 37, 0.75);

    white-space: nowrap;

    width: 100%;

    min-width: 0;

  }

  .theme-classic .homepage-packages-row__features-grid li > span:not(.material-symbols-outlined), .theme-bold .homepage-packages-row__features-grid li > span:not(.material-symbols-outlined) {

    min-width: 0;

    direction: rtl;

    text-align: right;

  }

  .theme-classic .homepage-packages-row__features-grid .material-symbols-outlined, .theme-bold .homepage-packages-row__features-grid .material-symbols-outlined {

    font-size: 1.1rem;

    color: var(--primary-color, #8b6f5c);

    flex-shrink: 0;

    line-height: 1;

  }

  .theme-classic .homepage-packages-row__action, .theme-bold .homepage-packages-row__action {

    grid-column: 3;

    justify-self: end;

    flex: 0 0 auto;

    display: flex;

    flex-direction: column;

    align-items: center;

    gap: 0.75rem;

    min-width: 9rem;

    margin: 0;

  }

  .theme-classic .homepage-packages-row__price, .theme-bold .homepage-packages-row__price {

    font-size: 2rem;

    font-weight: 700;

    color: var(--primary-color, #8b6f5c);

    display: flex;

    align-items: baseline;

    gap: 0.15rem;

    direction: ltr;

  }

  .theme-classic .homepage-packages-row__price-currency, .theme-bold .homepage-packages-row__price-currency {

    font-size: 1rem;

    font-weight: 400;

  }

  .theme-classic .homepage-packages-row__btn, .theme-bold .homepage-packages-row__btn {

    white-space: nowrap;

    padding: 0.65rem 1.25rem;

    font-size: 0.75rem;

    font-weight: 600;

    letter-spacing: 0.04em;

    border-radius: 2px;

    transition: all 0.3s ease;

    cursor: pointer;

  }

  .theme-classic .homepage-packages-row__btn--featured, .theme-bold .homepage-packages-row__btn--featured {

    background: var(--primary-color, #8b6f5c);

    color: #ffffff;

    border: none;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  }

  .theme-classic .homepage-packages-row__btn--featured:hover, .theme-bold .homepage-packages-row__btn--featured:hover {

    filter: brightness(1.08);

  }

  .theme-classic .homepage-packages-row__btn--default, .theme-bold .homepage-packages-row__btn--default {

    background: transparent;

    color: var(--primary-color, #8b6f5c);

    border: 1px solid rgba(139, 111, 92, 0.4);

  }

  .theme-classic .homepage-packages-row__btn--default:hover, .theme-bold .homepage-packages-row__btn--default:hover {

    background: var(--primary-color, #8b6f5c);

    color: #ffffff;

  }

  @media (max-width: 767px) {

    .theme-classic .homepage-packages-section, .theme-bold .homepage-packages-section {

      padding-top: 100px !important;

    }

    .theme-classic .homepage-packages-section {

      background: linear-gradient(
        to bottom,
        #FAFAF8 0%,
        #FAFAF8 40px,
        #FBF9F6 110px,
        #FAF7F4 210px,
        #FAF7F4 calc(100% - 96px),
        #FAFAF8 100%
      );

    }

    .theme-classic .homepage-packages-section__inner, .theme-bold .homepage-packages-section__inner {

      padding-inline: clamp(1rem, 4vw, 1.5rem);

    }

    .theme-classic .homepage-packages-row, .theme-bold .homepage-packages-row {

      display: flex;

      flex-direction: column;

      align-items: stretch;

      justify-content: flex-start;

      gap: 1.25rem;

      padding: 1.5rem 0;

      direction: rtl;

    }

    .theme-classic .homepage-packages-row__title, .theme-bold .homepage-packages-row__title {

      grid-column: auto;

      justify-self: stretch;

      flex: none;

      width: 100%;

      min-width: 0;

      max-width: none;

      text-align: right;

    }

    .theme-classic .homepage-packages-row__features, .theme-bold .homepage-packages-row__features {

      grid-column: auto;

      justify-self: start;

      margin-inline-start: 0;

      width: 100%;

    }

    .theme-classic .homepage-packages-row__features-grid, .theme-bold .homepage-packages-row__features-grid {

      grid-template-columns: 1fr;

      gap: 12px;

      width: 100%;

      max-width: 100%;

    }

    .theme-classic .homepage-packages-row__features-grid li, .theme-bold .homepage-packages-row__features-grid li {

      white-space: normal;

      width: 100%;

      max-width: 100%;

    }

    .theme-classic .homepage-packages-row__badge, .theme-bold .homepage-packages-row__badge {

      position: static;

      margin-bottom: 0.5rem;

    }

    .theme-classic .homepage-packages-row__action, .theme-bold .homepage-packages-row__action {

      grid-column: auto;

      justify-self: stretch;

      flex-direction: row;

      justify-content: space-between;

      align-items: center;

      width: 100%;

      min-width: 0;

      margin-left: 0;

    }

    .theme-classic .homepage-packages-row__btn, .theme-bold .homepage-packages-row__btn {

      flex-shrink: 0;

    }

  }

`

const BOLD_PACKAGES_ROWS_CSS = `

  .theme-bold .homepage-packages-section {
    background: linear-gradient(
      to bottom,
      #121217 0%,
      #121217 56px,
      #14141b 140px,
      #171720 240px,
      #1a1a22 320px,
      #1a1a22 calc(100% - 128px),
      #121217 100%
    );
  }

  .theme-bold .homepage-packages-row {
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }

  .theme-bold .homepage-packages-row--featured {
    background: rgba(255, 255, 255, 0.04);
  }

  .theme-bold .homepage-packages-row__features-grid li {
    color: rgba(245, 245, 240, 0.75);
  }

  .theme-bold .homepage-packages-row__btn--default {
    border-color: rgba(255, 255, 255, 0.28);
  }

  @media (max-width: 767px) {
    .theme-bold .homepage-packages-section {
      background: linear-gradient(
        to bottom,
        #121217 0%,
        #121217 40px,
        #14141b 110px,
        #171720 200px,
        #1a1a22 280px,
        #1a1a22 calc(100% - 96px),
        #121217 100%
      );
    }
  }

`



const POSTS_PACKAGES_TRANSITION_CSS = `

  .hp-posts-section {
    position: relative;
  }

  .hp-posts-section::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 72px;
    pointer-events: none;
  }

  .theme-elegant .hp-posts-section::after {
    background: linear-gradient(to bottom, transparent 0%, rgba(253, 248, 247, 0.55) 100%);
  }

  .theme-modern .hp-posts-section::after {
    background: linear-gradient(to bottom, transparent 0%, rgba(248, 250, 252, 0.7) 100%);
  }

  .theme-classic .hp-posts-section::after {
    background: linear-gradient(to bottom, transparent 0%, rgba(250, 247, 244, 0.62) 100%);
  }

  .theme-bold .hp-posts-section::after {
    background: linear-gradient(to bottom, transparent 0%, rgba(26, 26, 34, 0.58) 100%);
  }

  .homepage-packages-section .about-glow {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0.62) 50%, #000 76%, #000 84%, rgba(0,0,0,0.45) 93%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0.62) 50%, #000 76%, #000 84%, rgba(0,0,0,0.45) 93%, transparent 100%);
  }

  .homepage-packages-section .about-glow-left {
    opacity: 0.56;
  }

  .homepage-packages-section .about-glow-right {
    opacity: 0.6;
  }

  .theme-elegant #pricing > [aria-hidden="true"],
  .theme-modern #pricing > [aria-hidden="true"] {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 24%, rgba(0,0,0,0.64) 54%, #000 72%, #000 82%, rgba(0,0,0,0.42) 92%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 24%, rgba(0,0,0,0.64) 54%, #000 72%, #000 82%, rgba(0,0,0,0.42) 92%, transparent 100%);
  }

  .theme-elegant #pricing::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 128px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to bottom, #fdf8f7 0%, rgba(253, 248, 247, 0.82) 38%, transparent 100%);
  }

  .theme-elegant #pricing::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 128px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to top, #fdf8f7 0%, rgba(253, 248, 247, 0.82) 38%, transparent 100%);
  }

  .theme-modern #pricing {
    position: relative;
  }

  .theme-modern #pricing::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 96px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to bottom, #F8FAFC 0%, rgba(248, 250, 252, 0.76) 44%, transparent 100%);
  }

  .theme-modern #pricing::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 96px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to top, #F8FAFC 0%, rgba(248, 250, 252, 0.76) 44%, transparent 100%);
  }

  .theme-classic .homepage-packages-section::after,
  .theme-bold .homepage-packages-section::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 128px;
    pointer-events: none;
    z-index: 1;
  }

  .theme-classic .homepage-packages-section::after {
    background: linear-gradient(to top, #FAFAF8 0%, rgba(250, 250, 248, 0.72) 42%, transparent 100%);
  }

  .theme-bold .homepage-packages-section::after {
    background: linear-gradient(to top, #121217 0%, rgba(18, 18, 23, 0.72) 42%, transparent 100%);
  }

  @media (max-width: 767px) {
    .theme-elegant #pricing::after,
    .theme-modern #pricing::after,
    .theme-elegant #pricing::before,
    .theme-modern #pricing::before,
    .theme-classic .homepage-packages-section::after,
    .theme-bold .homepage-packages-section::after {
      height: 96px;
    }
  }

`



const RECENT_PHOTOS_GRID_CSS = `

  .recent-photos-section {

    width: 100%;

    overflow: hidden;

    padding-top: calc(2rem + 50px) !important;

    padding-bottom: 1.5rem !important;

  }

  @media (min-width: 768px) {

    .recent-photos-section {

      padding-top: calc(3rem + 50px) !important;

      padding-bottom: 2rem !important;

    }

  }

  .recent-photos-header {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    margin-bottom: 1rem;

    padding-inline: 2%;

    text-align: right !important;

    box-sizing: border-box;

  }

  .recent-photos-header > div:not(.hp-posts-header--classic) {

    display: flex;

    flex-direction: column;

    align-items: flex-end !important;

    justify-content: flex-start !important;

    text-align: right !important;

    width: 100%;

  }

  .recent-photos-header .elegant-section-heading {

    justify-items: end !important;

    text-align: right !important;

  }

  .portfolio-cta-wrap {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

    padding-bottom: 0;

    box-sizing: border-box;

  }

  .recent-photos-header > div:not(.hp-posts-header--classic):has(.portfolio-cta-wrap) {

    flex-direction: row-reverse !important;

    justify-content: space-between !important;

    align-items: flex-end !important;

  }

  .recent-photos-header .portfolio-cta-wrap {

    padding-inline: 0;

    width: auto;

    flex-shrink: 0;

  }

  .recent-photos-header .portfolio-cta-wrap .hp-posts-more {

    margin-top: 0;

  }

  .recent-photos-grid {

    display: grid;

    grid-template-columns: repeat(1, 1fr);

    gap: 3px;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

  }

  @media (min-width: 640px) {

    .recent-photos-grid {

      grid-template-columns: repeat(2, 1fr);

      gap: 4px;

    }

  }

  @media (min-width: 768px) {

    .recent-photos-grid {

      grid-template-columns: repeat(3, 1fr);

    }

  }

  @media (min-width: 1024px) {

    .recent-photos-grid {

      grid-template-columns: repeat(4, 1fr);

    }

  }

  .recent-photo-cell {

    position: relative;

    display: block;

    aspect-ratio: 4 / 3;

    overflow: hidden;

    background: #eae8e5;

    text-decoration: none;

    opacity: 0;

    transform: scale(0.82);

    transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0, 0.2, 1);

    will-change: opacity, transform;

  }

  .recent-photo-cell.is-visible {

    opacity: 1;

    transform: scale(1);

  }

  .recent-photo-img {

    position: absolute;

    inset: 0;

    width: 100%;

    height: 100%;

    object-fit: cover;

    transition: transform 1s ease-out;

  }

  .recent-photo-cell:hover .recent-photo-img { transform: scale(1.06); }

  /* Theme radius variants (mirror the gallery cards) */

  .recent-photos-grid--elegant .recent-photo-cell { border-radius: 0px; }

  .recent-photos-grid--modern .recent-photo-cell { border-radius: 12px; }

  .recent-photos-grid--classic .recent-photo-cell { border-radius: 4px; }

  .recent-photos-grid--dark .recent-photo-cell { border-radius: 0px; }

`

const CLASSIC_RECENT_PHOTOS_HEADER_CSS = `

  .theme-classic .recent-photos-header {
    margin-bottom: 2.5rem;
    text-align: left !important;
    direction: ltr;
  }

  .theme-classic .recent-photos-header > .hp-posts-header.hp-posts-header--classic {
    display: flex;
    flex-direction: row !important;
    justify-content: space-between;
    align-items: center !important;
    width: 100%;
    max-width: 100%;
    padding-inline: 0;
    margin-bottom: 0;
    text-align: left !important;
    direction: ltr;
    box-sizing: border-box;
  }

  .theme-classic .recent-photos-header .hp-posts-header__titles {
    display: flex;
    flex-direction: column;
    align-items: flex-start !important;
    text-align: left !important;
    order: 1;
    min-width: 0;
  }

  .theme-classic .recent-photos-header .hp-posts-eyebrow,
  .theme-classic .recent-photos-header .hp-posts-title {
    text-align: left !important;
  }

  .theme-classic .recent-photos-header .hp-posts-eyebrow {
    display: block;
    font-size: 13px;
    letter-spacing: 0.02em;
    text-transform: none;
    margin-bottom: 4px;
  }

  .theme-classic .recent-photos-header .hp-posts-title {
    font-size: 32px;
    line-height: 1.1;
    font-weight: 500;
    margin: 0;
  }

  @media (min-width: 768px) {
    .theme-classic .recent-photos-header .hp-posts-title {
      font-size: 46px;
    }
  }

  .theme-classic .recent-photos-header .hp-posts-divider {
    width: 56px;
    height: 1px;
    margin: 8px 0 0;
    margin-left: 0;
    margin-right: auto;
  }

  .theme-classic .recent-photos-header .hp-posts-header__more {
    order: 2;
    margin-left: auto;
    flex-shrink: 0;
  }

  .theme-classic .recent-photos-header .hp-posts-header__more .hp-posts-more,
  .theme-classic .recent-photos-header .hp-posts-header__more .portfolio-cta-wrap .hp-posts-more {
    margin-top: 0;
    justify-content: flex-end;
  }

  .theme-classic .recent-photos-header .hp-posts-header__more .portfolio-cta-wrap {
    padding-inline: 0;
    width: auto;
  }

  @media (max-width: 767px) {
    .theme-classic .recent-photos-header {
      text-align: left !important;
    }

    .theme-classic .recent-photos-header > .hp-posts-header.hp-posts-header--classic {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 1rem;
      direction: ltr;
    }

    .theme-classic .recent-photos-header .hp-posts-header__more {
      align-self: flex-end;
      margin-left: 0;
    }
  }

`



const HOMEPAGE_REVEAL_INIT_SCRIPT = `

(function initHomepageReveal() {

  var observerOptions = { threshold: 0.08, rootMargin: '0px 0px 8% 0px' };

  var observer = new IntersectionObserver(function(entries) {

    entries.forEach(function(entry) {

      if (entry.isIntersecting) entry.target.classList.add('active');

    });

  }, observerOptions);



  function observeRevealElements() {

    document.querySelectorAll('.reveal:not(.active)').forEach(function(el) {

      observer.observe(el);

    });

  }



  function activateRevealElementsInView() {

    document.querySelectorAll('.reveal:not(.active)').forEach(function(el) {

      var rect = el.getBoundingClientRect();

      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {

        el.classList.add('active');

      }

    });

  }



  function boot() {

    observeRevealElements();

    activateRevealElementsInView();

    window.addEventListener('scroll', activateRevealElementsInView, { passive: true });

    window.addEventListener('resize', activateRevealElementsInView);

  }



  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', boot);

  } else {

    boot();

  }

  window.addEventListener('load', activateRevealElementsInView);

})();

`



const HOMEPAGE_GALLERY_REVEAL_SCRIPT = `

(function initHomepageGalleryReveal() {

  function boot() {

    var targets = [].slice.call(document.querySelectorAll('.homepage-gallery-reveal'));

    if (!targets.length) return;

    function revealTarget(el) {

      if (!el.classList.contains('is-visible')) el.classList.add('is-visible');

    }

    function revealTargetsInView() {

      var viewportBottom = window.innerHeight;

      targets.forEach(function(el) {

        var rect = el.getBoundingClientRect();

        if (rect.top < viewportBottom && rect.bottom > 0) {

          revealTarget(el);

        }

      });

    }

    if (!('IntersectionObserver' in window)) {

      targets.forEach(revealTarget);

      return;

    }

    var observer = new IntersectionObserver(function(entries) {

      entries.forEach(function(entry) {

        if (entry.isIntersecting) revealTarget(entry.target);

      });

    }, { threshold: 0.01, rootMargin: '80px 0px 80px 0px' });

    targets.forEach(function(el) { observer.observe(el); });

    revealTargetsInView();

    window.addEventListener('scroll', revealTargetsInView, { passive: true });

    window.addEventListener('resize', revealTargetsInView);

    window.addEventListener('load', revealTargetsInView);

    window.setTimeout(revealTargetsInView, 120);

    window.setTimeout(function() {

      targets.forEach(function(el) {

        if (!el.classList.contains('is-visible')) revealTarget(el);

      });

    }, 1800);

  }

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', boot);

  } else {

    boot();

  }

})();

`



const RECENT_PHOTOS_REVEAL_SCRIPT = `

(function initRecentPhotosReveal() {

  function boot() {

    var cells = [].slice.call(document.querySelectorAll('.recent-photo-cell'));

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

    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    cells.forEach(function(c) { observer.observe(c); });

  }

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', boot);

  } else {

    boot();

  }

})();

`



const FAQ_ACCORDION_CSS = `

  .faq-section {

    width: 100%;

  }

  .faq-accordion {

    display: flex;

    flex-direction: column;

    gap: 0.75rem;

    max-width: 42rem;

    margin-inline: auto;

    interpolate-size: allow-keywords;

  }

  .faq-item {

    border: 1px solid rgba(0, 0, 0, 0.1);

    border-radius: 0.75rem;

    overflow: hidden;

    background: #ffffff;

  }

  .faq-item summary {

    cursor: pointer;

    padding: 1rem 1.25rem;

    list-style: none;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 1rem;

    font-weight: 500;

    text-align: right;

  }

  .faq-item summary::-webkit-details-marker {

    display: none;

  }

  .faq-item summary::after {

    content: '+';

    font-size: 1.25rem;

    line-height: 1;

    flex-shrink: 0;

    transition: transform 0.3s ease;

  }

  .faq-item[open] summary::after {

    content: '−';

  }

  /* Modern browsers: smoothly animate the collapsible height */

  .faq-item::details-content {

    block-size: 0;

    overflow: hidden;

    transition: block-size 0.35s ease, content-visibility 0.35s ease allow-discrete;

  }

  .faq-item[open]::details-content {

    block-size: auto;

  }

  /* Fallback (and complement): fade + slide the answer in on open */

  @keyframes faqAnswerReveal {

    from {

      opacity: 0;

      transform: translateY(-0.5rem);

    }

    to {

      opacity: 0.85;

      transform: translateY(0);

    }

  }

  .faq-item[open] .faq-answer {

    animation: faqAnswerReveal 0.35s ease both;

  }

  @media (prefers-reduced-motion: reduce) {

    .faq-item::details-content,

    .faq-item summary::after {

      transition: none;

    }

    .faq-item[open] .faq-answer {

      animation: none;

    }

  }

  .faq-answer {

    padding: 0 1.25rem 1rem;

    line-height: 1.7;

    white-space: pre-line;

    opacity: 0.85;

    border-top: 1px solid rgba(0, 0, 0, 0.06);

    padding-top: 0.75rem;

    margin: 0 1.25rem 1rem;

  }

  .faq-item--dark {

    background: rgba(255, 255, 255, 0.04);

    border-color: rgba(255, 255, 255, 0.12);

  }

  .faq-item--dark .faq-answer {

    border-top-color: rgba(255, 255, 255, 0.1);

  }

`

const MODERN_FAQ_ACCORDION_CSS = `

  .theme-modern .faq-accordion--modern,
  .theme-bold .faq-accordion--modern {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0 60px;
    direction: rtl;
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
    interpolate-size: allow-keywords;
  }

  .theme-modern .faq-accordion__column,
  .theme-bold .faq-accordion__column {
    display: flex;
    flex-direction: column;
    direction: rtl;
    min-width: 0;
  }

  .theme-modern .faq-item--modern,
  .theme-bold .faq-item--modern {
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: hidden;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .theme-bold .faq-item--modern {
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }

  .theme-modern .faq-item--modern summary,
  .theme-modern .faq-item--modern .faq-item__summary,
  .theme-bold .faq-item--modern summary,
  .theme-bold .faq-item--modern .faq-item__summary {
    cursor: pointer;
    padding: 1.5rem 0;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    direction: rtl;
    width: 100%;
    font-weight: 500;
    text-align: right;
  }

  .theme-modern .faq-item--modern summary::-webkit-details-marker,
  .theme-bold .faq-item--modern summary::-webkit-details-marker {
    display: none;
  }

  .theme-modern .faq-item--modern summary::after,
  .theme-bold .faq-item--modern summary::after {
    content: none;
    display: none;
  }

  .theme-modern .faq-item--modern .faq-item__question,
  .theme-bold .faq-item--modern .faq-item__question {
    flex: 1;
    min-width: 0;
    text-align: right;
    direction: rtl;
  }

  .theme-modern .faq-item--modern .faq-item__toggle,
  .theme-bold .faq-item--modern .faq-item__toggle {
    flex-shrink: 0;
    align-self: center;
    font-size: 1.25rem;
    line-height: 1;
    transition: transform 0.3s ease;
  }

  .theme-modern .faq-item--modern .faq-item__toggle::before,
  .theme-bold .faq-item--modern .faq-item__toggle::before {
    content: '+';
  }

  .theme-modern .faq-item--modern[open] .faq-item__toggle::before,
  .theme-bold .faq-item--modern[open] .faq-item__toggle::before {
    content: '−';
  }

  .theme-modern .faq-item--modern::details-content,
  .theme-bold .faq-item--modern::details-content {
    block-size: 0;
    overflow: hidden;
    transition: block-size 0.35s ease, content-visibility 0.35s ease allow-discrete;
  }

  .theme-modern .faq-item--modern[open]::details-content,
  .theme-bold .faq-item--modern[open]::details-content {
    block-size: auto;
  }

  .theme-modern .faq-item--modern[open] .faq-answer,
  .theme-bold .faq-item--modern[open] .faq-answer {
    animation: faqAnswerReveal 0.35s ease both;
  }

  .theme-modern .faq-item--modern .faq-answer,
  .theme-bold .faq-item--modern .faq-answer {
    width: 100%;
    padding: 0 0 1.5rem;
    line-height: 1.7;
    white-space: pre-line;
    opacity: 0.85;
    text-align: right;
    direction: rtl;
    border-top: none;
    margin: 0;
    box-sizing: border-box;
  }

  @media (max-width: 767px) {
    .theme-modern .faq-accordion--modern,
    .theme-bold .faq-accordion--modern {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-modern .faq-item--modern::details-content,
    .theme-modern .faq-item--modern .faq-item__toggle,
    .theme-bold .faq-item--modern::details-content,
    .theme-bold .faq-item--modern .faq-item__toggle {
      transition: none;
    }

    .theme-modern .faq-item--modern[open] .faq-answer,
    .theme-bold .faq-item--modern[open] .faq-answer {
      animation: none;
    }
  }

`



const FAQ_SECTION_GLOW_CSS = `

  .theme-modern #faq,
  .theme-bold #faq {
    position: relative;
  }

  .faq-section-glow {
    position: absolute;
    top: 0;
    bottom: 0;
    width: min(26rem, 48vw);
    pointer-events: none;
    z-index: 0;
    filter: blur(72px);
    opacity: 0.66;
  }

  .faq-section-glow--left {
    left: 0;
    transform: translateX(-44%);
  }

  .faq-section-glow--right {
    right: 0;
    transform: translateX(44%);
  }

  .theme-modern #faq .faq-section-glow,
  .theme-bold #faq .faq-section-glow {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0.34) 32%, rgba(0,0,0,0.56) 50%, rgba(0,0,0,0.56) 68%, rgba(0,0,0,0.26) 86%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0.34) 32%, rgba(0,0,0,0.56) 50%, rgba(0,0,0,0.56) 68%, rgba(0,0,0,0.26) 86%, transparent 100%);
  }

  .theme-modern #faq::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to bottom, #F8FAFC 0%, rgba(248, 250, 252, 0.82) 28%, rgba(248, 250, 252, 0.34) 58%, transparent 100%);
  }

  .theme-modern #faq::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 120px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to top, #F8FAFC 0%, rgba(248, 250, 252, 0.82) 28%, rgba(248, 250, 252, 0.34) 58%, transparent 100%);
  }

  .theme-bold #faq::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to bottom, #121217 0%, rgba(18, 18, 23, 0.82) 28%, rgba(18, 18, 23, 0.34) 58%, transparent 100%);
  }

  .theme-bold #faq::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 120px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to top, #121217 0%, rgba(18, 18, 23, 0.82) 28%, rgba(18, 18, 23, 0.34) 58%, transparent 100%);
  }

`



function magazineFaqGridCss(primaryColor: string) {

  return `

  .theme-classic .faq-magazine-wrap,

  .theme-elegant .faq-magazine-wrap {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

    box-sizing: border-box;

  }

  .theme-classic .faq-magazine-layout--with-image,

  .theme-elegant .faq-magazine-layout--with-image {

    display: grid;

    grid-template-columns: 1.2fr 1fr;

    gap: 60px;

    direction: rtl;

    align-items: start;

    width: 100%;

  }

  .theme-classic .faq-magazine-content,

  .theme-elegant .faq-magazine-content {

    min-width: 0;

    width: 100%;

  }

  .theme-classic .faq-magazine-feature,

  .theme-elegant .faq-magazine-feature {

    min-width: 0;

    width: 100%;

    align-self: stretch;

    min-height: 100%;

  }

  .theme-classic .faq-magazine-feature__image,

  .theme-elegant .faq-magazine-feature__image {

    width: 100%;

    height: 100%;

    min-height: clamp(20rem, 52vh, 36rem);

    object-fit: cover;

    border-radius: 12px;

    display: block;

  }

  .theme-classic .faq-magazine-layout--with-image .faq-magazine-grid,

  .theme-elegant .faq-magazine-layout--with-image .faq-magazine-grid {

    grid-template-columns: 1fr;

    gap: 50px 0;

  }

  .theme-classic .faq-magazine-layout--with-image .faq-magazine-item--featured,

  .theme-elegant .faq-magazine-layout--with-image .faq-magazine-item--featured {

    grid-column: auto;

  }

  .theme-classic .faq-magazine-layout--with-image .faq-magazine-item:not(.faq-magazine-item--featured):nth-child(2n + 3),

  .theme-elegant .faq-magazine-layout--with-image .faq-magazine-item:not(.faq-magazine-item--featured):nth-child(2n + 3) {

    margin-top: 0;

  }

  @media (max-width: 768px) {

    .theme-classic .faq-section--with-image,

    .theme-elegant .faq-section--with-image {

      position: relative;

      width: 100%;

      background-image: var(--faq-section-bg-image);

      background-position: center;

      background-size: cover;

      background-repeat: no-repeat;

      padding: 40px 20px !important;

      overflow: hidden;

      isolation: isolate;

    }

    .theme-classic .faq-section--with-image::before,

    .theme-elegant .faq-section--with-image::before {

      content: '';

      position: absolute;

      inset: 0;

      z-index: 0;

      background: rgba(251, 249, 244, 0.85);

      backdrop-filter: blur(8px);

      -webkit-backdrop-filter: blur(8px);

      pointer-events: none;

    }

    .theme-elegant .faq-section--with-image::before {

      background: rgba(255, 255, 255, 0.88);

    }

    .theme-classic .faq-section--with-image > *,

    .theme-elegant .faq-section--with-image > * {

      position: relative;

      z-index: 1;

    }

    .theme-classic .faq-section--with-image .faq-magazine-layout--with-image,

    .theme-elegant .faq-section--with-image .faq-magazine-layout--with-image {

      display: block;

      width: 100%;

      gap: 0;

    }

    .theme-classic .faq-section--with-image .faq-magazine-feature,

    .theme-elegant .faq-section--with-image .faq-magazine-feature {

      display: none;

    }

    .theme-classic .faq-section--with-image .faq-magazine-wrap,

    .theme-elegant .faq-section--with-image .faq-magazine-wrap {

      padding-inline: 0;

      width: 100%;

    }

    .theme-classic .faq-section--with-image .faq-magazine-grid,

    .theme-elegant .faq-section--with-image .faq-magazine-grid {

      display: flex;

      flex-direction: column;

      gap: 50px;

      width: 100%;

    }

    .theme-classic .faq-section--with-image .faq-magazine-item,

    .theme-elegant .faq-section--with-image .faq-magazine-item,

    .theme-classic .faq-section--with-image .faq-magazine-item__question,

    .theme-elegant .faq-section--with-image .faq-magazine-item__question,

    .theme-classic .faq-section--with-image .faq-magazine-item__answer,

    .theme-elegant .faq-section--with-image .faq-magazine-item__answer {

      text-align: right;

    }

    .theme-classic .faq-magazine-layout--with-image,

    .theme-elegant .faq-magazine-layout--with-image {

      display: block;

      width: 100%;

      gap: 0;

    }

  }

  .theme-classic .faq-magazine-grid,

  .theme-elegant .faq-magazine-grid {

    display: grid;

    direction: rtl;

    grid-template-columns: 1fr;

    gap: 50px 60px;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding: 0;

    box-sizing: border-box;

    background: transparent;

    border: none;

    box-shadow: none;

  }

  @media (min-width: 768px) {

    .theme-classic .faq-magazine-grid,

    .theme-elegant .faq-magazine-grid {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

    .theme-classic .faq-magazine-item--featured,

    .theme-elegant .faq-magazine-item--featured {

      grid-column: 1 / -1;

    }

    .theme-classic .faq-magazine-item:not(.faq-magazine-item--featured):nth-child(2n + 3),

    .theme-elegant .faq-magazine-item:not(.faq-magazine-item--featured):nth-child(2n + 3) {

      margin-top: 2.5rem;

    }

  }

  .theme-classic .faq-magazine-item,

  .theme-elegant .faq-magazine-item {

    background: transparent;

    border: none;

    border-radius: 0;

    box-shadow: none;

    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    padding: 0 0 clamp(2rem, 4vw, 2.75rem);

    text-align: right;

    direction: rtl;

    display: flex;

    flex-direction: column;

    align-items: stretch;

    gap: 0.85rem;

    min-height: 0;

  }

  .theme-classic .faq-magazine-item__heading,

  .theme-elegant .faq-magazine-item__heading {

    display: flex;

    flex-direction: row;

    align-items: flex-start;

    justify-content: flex-start;

    gap: clamp(0.75rem, 2vw, 1.25rem);

    direction: rtl;

    text-align: right;

  }

  .theme-classic .faq-magazine-item__number,

  .theme-elegant .faq-magazine-item__number {

    color: transparent;

    -webkit-text-stroke: 1.5px ${primaryColor};

    paint-order: stroke fill;

    font-weight: 800;

    font-size: clamp(2rem, 5vw, 2.5rem);

    line-height: 1;

    flex-shrink: 0;

    font-variant-numeric: tabular-nums;

    letter-spacing: -0.02em;

    user-select: none;

  }

  .theme-classic .faq-magazine-item--featured .faq-magazine-item__number,

  .theme-elegant .faq-magazine-item--featured .faq-magazine-item__number {

    font-size: clamp(2.75rem, 6vw, 3.5rem);

  }

  .theme-elegant .faq-magazine-item__question {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(1rem, 2.4vw, 1.125rem);

    font-weight: 400;

    line-height: 1.55;

    color: ${primaryColor};

    margin: 0;

    text-align: right;

    flex: 1;

  }

  .theme-elegant .faq-magazine-item--featured .faq-magazine-item__question {

    font-size: clamp(1.15rem, 2.8vw, 1.35rem);

  }

  .theme-elegant .faq-magazine-item__answer {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(0.8125rem, 2.1vw, 0.975rem);

    font-weight: 300;

    line-height: 1.75;

    color: #0F0F0D;

    margin: 0;

    text-align: right;

    white-space: pre-line;

  }

  .theme-classic .faq-magazine-item__question {

    font-family: var(--headline-font, 'Heebo'), 'Heebo', sans-serif;

    font-size: clamp(1rem, 2.3vw, 1.2rem);

    font-weight: 600;

    line-height: 1.45;

    color: ${primaryColor};

    margin: 0;

    text-align: right;

    flex: 1;

  }

  .theme-classic .faq-magazine-item--featured .faq-magazine-item__question {

    font-size: clamp(1.2rem, 2.8vw, 1.45rem);

  }

  .theme-classic .faq-magazine-item__answer {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(0.875rem, 2vw, 1rem);

    font-weight: 400;

    line-height: 1.7;

    color: #5a504a;

    margin: 0;

    text-align: right;

    white-space: pre-line;

  }`

}



function elegantFaqSectionCss(primaryColor: string) {

  return `

  ${magazineFaqGridCss(primaryColor)}

  .faq-section__header,

  .testimonials-section__header {

    width: 100%;

    direction: ltr;

    text-align: left !important;

    margin-bottom: 1.25rem;

    padding-inline: 2%;

    box-sizing: border-box;

  }

  .faq-section__header .elegant-section-heading,

  .testimonials-section__header .elegant-section-heading {

    display: grid !important;

    width: 100%;

    max-width: 100%;

    justify-items: left !important;

    align-items: last baseline;

    text-align: left !important;

  }

  .faq-section__header .elegant-section-heading__watermark,

  .faq-section__header .elegant-section-heading__title,

  .testimonials-section__header .elegant-section-heading__watermark,

  .testimonials-section__header .elegant-section-heading__title {

    text-align: left !important;

    justify-self: left !important;

  }

  .faq-section__header .elegant-section-heading__title,

  .testimonials-section__header .elegant-section-heading__title {

    direction: rtl;

  }

  @media (max-width: 767px) {

    .faq-section__header .elegant-section-heading,

    .testimonials-section__header .elegant-section-heading {

      text-align: left !important;

      justify-items: left !important;

    }

    .faq-section__header .elegant-section-heading__watermark,

    .faq-section__header .elegant-section-heading__title,

    .testimonials-section__header .elegant-section-heading__watermark,

    .testimonials-section__header .elegant-section-heading__title {

      text-align: left !important;

      justify-self: left !important;

    }

  }

  .faq-section__subtitle {

    text-align: left !important;

    margin-top: 0.35rem;

    max-width: none;

  }`

}



function classicFaqSectionCss(primaryColor: string) {

  return magazineFaqGridCss(primaryColor)

}



const CLASSIC_CONTACT_FORM_CSS = `

  .theme-classic .classic-contact-layout {

    align-items: start;

  }

  .theme-classic .classic-contact-info {

    width: 100%;

    min-width: 0;

    text-align: right;

  }

  .theme-classic .classic-contact-info h2,

  .theme-classic .classic-contact-info p,

  .theme-classic .classic-contact-info > span {

    text-align: right;

  }

  .theme-classic .classic-contact-details {

    display: flex;

    flex-direction: column;

    gap: 1rem;

    width: 100%;

  }

  .theme-classic .classic-contact-details__link,
  .theme-classic .classic-contact-details__item {

    display: flex;

    align-items: center;

    gap: 0.75rem;

    width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-form {

    display: flex !important;

    flex-direction: column !important;

    align-items: stretch !important;

    width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-form > *:not(.contact-privacy-consent) {

    width: 100%;

    max-width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-form > .contact-privacy-consent {

    display: grid !important;

    grid-template-columns: auto 1fr !important;

    column-gap: 0.5rem;

    align-items: start !important;

    width: 100% !important;

    max-width: 100% !important;

    box-sizing: border-box;

  }

  .theme-classic .classic-contact-form .contact-privacy-checkbox {

    width: 1rem !important;

    height: 1rem !important;

    min-width: 1rem !important;

    min-height: 1rem !important;

    max-width: 1rem !important;

    max-height: 1rem !important;

    aspect-ratio: 1 / 1;

    flex-shrink: 0;

    margin-top: 0.2rem;

    border-radius: 2px;

    padding: 0;

    box-sizing: border-box;

    appearance: auto;

  }

  .theme-classic .classic-contact-form .contact-privacy-consent > p {

    flex: none !important;

    width: auto !important;

    max-width: 100% !important;

    min-width: 0;

    margin: 0;

    white-space: normal !important;

    word-break: normal !important;

    overflow-wrap: break-word;

  }

  .theme-classic .classic-contact-form .contact-privacy-consent label,
  .theme-classic .classic-contact-form .contact-privacy-consent a {

    display: inline !important;

    white-space: normal !important;

  }

  .theme-classic .classic-contact-form__message-block {

    display: flex !important;

    flex-direction: column !important;

    align-items: stretch !important;

    width: 100% !important;

    max-width: 100% !important;

    min-width: 0;

    margin-bottom: 1.5rem;

    overflow: visible !important;

  }

  .theme-classic .classic-contact-form__message-block > * {

    width: 100%;

    max-width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-form__row {

    display: grid;

    grid-template-columns: minmax(0, 1fr);

    gap: 1.5rem;

    width: 100%;

  }

  @media (min-width: 768px) {

    .theme-classic .classic-contact-form__row {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

  }

  .theme-classic .classic-contact-field {

    display: flex;

    flex-direction: column;

    gap: 0.35rem;

    width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-field label {

    width: 100%;

  }

  .theme-classic .classic-contact-form input,
  .theme-classic .classic-contact-form textarea {

    width: 100%;

    min-width: 0;

    box-sizing: border-box;

  }

`



const TESTIMONIAL_THUMB_CARD_CSS = `

  .testimonials-bleed {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    box-sizing: border-box;
  }

  .testimonials-section-grid:has(.testimonials-bleed) {
    padding-inline: 0;
  }

  .testimonials-marquee {
    overflow: hidden;
    position: relative;
    width: 100%;
    box-sizing: border-box;
    padding: 1rem 0;
    direction: ltr;
  }

  .testimonials-marquee-track {
    display: flex;
    flex-direction: row;
    direction: ltr;
    width: max-content;
    gap: 3rem;
    justify-content: flex-start;
    will-change: transform;
  }

  .testimonials-marquee-set {
    display: flex;
    flex-direction: row;
    flex: 0 0 auto;
    gap: 3rem;
    align-items: stretch;
  }

  .testimonials-marquee .testimonial-thumb-card {
    direction: rtl;
    flex: 0 0 auto;
  }

  .testimonials-marquee .reveal-on-scroll,
  .testimonials-marquee .animate-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .testimonials-marquee-track,
    .testimonials-marquee-set {
      gap: 2.25rem;
    }
  }

  @media (max-width: 767px) {
    .testimonials-marquee-track,
    .testimonials-marquee-set {
      gap: 1.75rem;
    }
  }

  .testimonials-section--modern .testimonials-section-grid,
  .theme-bold .testimonials-section-grid {
    padding-top: 1rem;
    padding-bottom: 50px;
  }

  .testimonials-section--modern .testimonials-marquee,
  .theme-bold .testimonials-marquee {
    padding-top: 1rem;
    padding-bottom: 0;
  }

  .testimonials-section--modern .classic-testimonials-carousel,
  .theme-bold .classic-testimonials-carousel {
    padding-bottom: 0;
  }

  .testimonials-section {

    background: transparent !important;

    overflow: visible;

  }

  .testimonials-section-grid {

    display: flex;

    flex-wrap: wrap;

    gap: 2.25rem 2.75rem;

    justify-content: center;

    align-items: stretch;

    padding-top: 1rem;

    padding-bottom: 1.5rem;

    padding-inline: 1.25rem;

    overflow: visible;

  }

  .testimonials-row {

    display: flex;

    flex-wrap: wrap;

    gap: 2.25rem 2.75rem;

    justify-content: center;

    align-items: stretch;

    width: 100%;

  }

  .classic-testimonials-slide .testimonials-row {

    justify-content: center;

  }

  @media (max-width: 767px) {

    .classic-testimonials-carousel .testimonials-row {

      flex-wrap: wrap;

      gap: 1rem;

      justify-content: center;

    }

    .testimonials-section-grid > .testimonial-thumb-card,

    .testimonials-row > .testimonial-thumb-card {

      flex: 0 1 100%;

      max-width: 100%;

      width: 100%;

      min-width: 0;

    }

  }

  @media (min-width: 768px) and (max-width: 1023px) {

    .classic-testimonials-carousel .testimonials-row {

      flex-wrap: wrap;

      gap: 1.5rem;

      justify-content: center;

    }

    .testimonials-section-grid > .testimonial-thumb-card,

    .testimonials-row > .testimonial-thumb-card {

      flex: 0 1 calc(50% - 0.75rem);

      max-width: calc(50% - 0.75rem);

      width: calc(50% - 0.75rem);

      min-width: 0;

    }

    .testimonial-thumb-card {

      padding: 1.85rem 1.25rem 1.85rem 4.75rem;

    }

  }

  @media (min-width: 1024px) {

    .classic-testimonials-carousel .testimonials-row {

      flex-wrap: nowrap;

      gap: 2.5rem;

    }

    .testimonials-section-grid > .testimonial-thumb-card,

    .testimonials-row > .testimonial-thumb-card {

      flex: 0 1 calc((100% - 5.5rem) / 3);

      max-width: min(24rem, calc((100% - 5.5rem) / 3));

      width: auto;

      min-width: 0;

    }

  }

  .testimonial-thumb-card {

    position: relative;

    background: #ffffff;

    width: 100%;

    max-width: min(100%, 24rem);

    min-width: 14rem;

    min-height: 8.5rem;

    align-self: stretch;

    flex: 0 1 auto;

    display: flex;

    flex-direction: column;

    padding: 2.15rem 1.5rem 2.15rem 5.25rem;

    margin-top: 0.85rem;

    box-sizing: border-box;

  }

  .testimonial-thumb-card__quote {

    position: absolute;

    top: 0;

    right: 1.35rem;

    left: auto;

    transform: translateY(-50%);

    display: inline-flex;

    align-items: center;

    justify-content: center;

    background: #ffffff;

    padding: 0 0.75rem;

    line-height: 1;

    z-index: 3;

    opacity: 0.42;

    font-size: 2.35rem;

    pointer-events: none;

  }

  .testimonial-thumb-card__content {

    flex: 1;

    display: flex;

    flex-direction: column;

    justify-content: space-between;

    position: relative;

    z-index: 1;

    margin-top: 0.35rem;

    min-height: 0;

  }

  .testimonial-thumb-card__text {

    flex: 1 1 auto;

    width: 100%;

    overflow-wrap: break-word;

    word-wrap: break-word;

  }

  .testimonial-thumb-card__footer {

    margin-top: auto;

    flex-shrink: 0;

  }

  .testimonial-thumb-card__thumb {

    position: absolute;

    left: -1.15rem;

    bottom: -0.85rem;

    width: 4.5rem;

    height: 4.5rem;

    overflow: hidden;

    border: 3px solid #ffffff;

    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);

    z-index: 2;

    background: #f3f0ed;

  }

  .testimonial-thumb-card__thumb img {

    width: 100%;

    height: 100%;

    object-fit: cover;

    display: block;

  }

  .testimonial-thumb-card--classic {

    border-radius: 2px;

    box-shadow: 0 1px 3px rgba(45, 40, 37, 0.08);

    border: 1px solid rgba(121, 116, 126, 0.2);

  }

  .testimonial-thumb-card--elegant {

    border: 1px solid rgba(121, 116, 126, 0.35);

  }

  .testimonial-thumb-card--modern {

    border-radius: 1rem;

    border: 1px solid rgba(121, 116, 126, 0.25);

    box-shadow: 0 10px 30px rgba(45, 40, 37, 0.08);

  }

  .testimonial-thumb-card--dark {

    background: #1c1c26;

    border: 1px solid rgba(255, 255, 255, 0.07);

    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);

    color: rgba(255, 255, 255, 0.92);

  }

  .testimonial-thumb-card--dark .testimonial-thumb-card__quote {

    background: #1c1c26;

    opacity: 0.88;

    font-size: 2.85rem;

  }

  .testimonial-thumb-card--dark .testimonial-thumb-card__thumb {

    border-color: #1c1c26;

    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);

    background: #12121b;

  }

  .testimonial-thumb-card--dark .text-on-surface,

  .testimonial-thumb-card--dark .text-on-surface-variant {

    color: rgba(255, 255, 255, 0.9);

  }

  .testimonial-thumb-card--dark .text-on-surface-variant {

    opacity: 0.62;

  }

  .classic-testimonials-carousel {

    overflow: hidden;

    width: 100%;

    padding-bottom: 1rem;

  }

  .classic-testimonials-track {

    display: flex;

    transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);

    direction: ltr;

  }

  .classic-testimonials-slide {

    flex: 0 0 100%;

    width: 100%;

    box-sizing: border-box;

    direction: rtl;

  }

  .classic-testimonials-dots {

    display: flex;

    justify-content: center;

    align-items: center;

    gap: 0.5rem;

    margin-top: 2rem;

  }

  .classic-testimonials-dot {

    width: 8px;

    height: 8px;

    border-radius: 9999px;

    background: rgba(45, 40, 37, 0.22);

    border: none;

    padding: 0;

    cursor: pointer;

    transition: all 0.35s ease;

  }

  .classic-testimonials-dot.is-active {

    width: 28px;

    background: rgba(45, 40, 37, 0.55);

  }

`



const TESTIMONIALS_MARQUEE_INIT_SCRIPT = `
(function initTestimonialsMarquee() {
  // Mirrors the modern hero film belt: measure the real pixel width of one card
  // set and drive the loop via the Web Animations API. No CSS percentages / vw /
  // RTL-anchoring, so the strip never empties or jumps at the seam.
  var SPEED_PX_PER_SEC = 55;

  function setup(container) {
    var track = container.querySelector('.testimonials-marquee-track');
    if (!track) return;
    var sets = track.querySelectorAll('.testimonials-marquee-set');
    if (sets.length < 2) return;
    var dup = sets[1];

    // Container width comes from CSS (94vw bleed wrapper). No JS viewport breakout.
    var containerWidth = Math.round(container.getBoundingClientRect().width);
    if (!containerWidth) return;

    var visibleW = document.documentElement.clientWidth || window.innerWidth;
    var perView = visibleW >= 1024 ? 3 : (visibleW >= 768 ? 2 : 1);
    var gapPx = visibleW >= 1024 ? 48 : (visibleW >= 768 ? 36 : 28);

    var uniqueCards = sets[0].querySelectorAll('.testimonial-thumb-card');
    var allCards = track.querySelectorAll('.testimonial-thumb-card');
    var unique = uniqueCards.length;

    // Only scroll when there are more testimonials than fit in one view.
    var willScroll = unique > perView;

    // Uniform card width so exactly perView cards fill the container width
    // (3 on desktop, 2 on tablet, 1 on mobile). Same sizing in both modes so a
    // static row looks identical to a scrolling one, just centered.
    var cardW = Math.floor((containerWidth - (perView - 1) * gapPx) / perView);
    var maxCardW = 384; // 24rem — same fixed max width as modern theme
    if (cardW > maxCardW) cardW = maxCardW;
    allCards.forEach(function (c) {
      c.style.width = cardW + 'px';
      c.style.minWidth = cardW + 'px';
      c.style.maxWidth = cardW + 'px';
      c.style.flex = '0 0 ' + cardW + 'px';
    });

    sets[0].style.marginLeft = '';
    sets[0].style.marginRight = '';

    if (!willScroll) {
      // Not enough testimonials for a belt -> one static, centered row, no motion.
      if (track.__mqAnim) { try { track.__mqAnim.cancel(); } catch (e) {} track.__mqAnim = null; }
      track.__mqShift = 0;
      track.__mqLayoutKey = '';
      dup.style.display = 'none';
      track.style.width = '100%';
      track.style.justifyContent = 'center';
      track.style.transform = 'none';
      sets[0].style.marginLeft = 'auto';
      sets[0].style.marginRight = 'auto';
      return;
    }

    dup.style.display = 'flex';
    track.style.width = '';
    track.style.justifyContent = '';
    track.style.transform = '';

    // Compute shift mathematically (one full set + track gap). Measuring
    // getBoundingClientRect between sets was unreliable on desktop and returned
    // 0, which skipped the animation entirely and left cards stuck on the left.
    var trackGap = parseFloat(getComputedStyle(track).gap);
    if (isNaN(trackGap)) trackGap = gapPx;
    var shift = unique * cardW + Math.max(0, unique - 1) * gapPx + Math.round(trackGap);
    if (shift < 1) return;

    var layoutKey = unique + 'x' + perView + 'x' + cardW;
    if (track.__mqAnim && track.__mqLayoutKey === layoutKey) {
      return;
    }
    track.__mqLayoutKey = layoutKey;
    track.__mqShift = shift;

    if (track.__mqAnim) { try { track.__mqAnim.cancel(); } catch (e) {} track.__mqAnim = null; }
    if (typeof track.animate !== 'function') return;

    var duration = (shift / SPEED_PX_PER_SEC) * 1000;
    track.__mqAnim = track.animate(
      [
        { transform: 'translate3d(0px, 0, 0)' },
        { transform: 'translate3d(' + (-shift) + 'px, 0, 0)' }
      ],
      { duration: duration, iterations: Infinity, easing: 'linear' }
    );

    if (!container.__mqHoverBound) {
      container.__mqHoverBound = true;
      container.addEventListener('mouseenter', function () {
        if (track.__mqAnim) { try { track.__mqAnim.pause(); } catch (e) {} }
      });
      container.addEventListener('mouseleave', function () {
        if (track.__mqAnim) { try { track.__mqAnim.play(); } catch (e) {} }
      });
    }
  }

  function setupAll() {
    document.querySelectorAll('[data-testimonials-marquee]').forEach(setup);
  }

  function boot() {
    setupAll();

    // All repeated triggers funnel through one debounce so we never thrash the
    // animation (which would freeze it). Card widths are fixed pixels, so the
    // measured shift is stable across image/font loads and the guard keeps the
    // single running animation alive.
    var t;
    function schedule() {
      clearTimeout(t);
      t = setTimeout(setupAll, 150);
    }

    window.addEventListener('load', schedule);
    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(schedule).catch(function () {});
    }
    document.querySelectorAll('[data-testimonials-marquee] img').forEach(function (img) {
      if (img.complete) return;
      img.addEventListener('load', schedule, { once: true });
      img.addEventListener('error', schedule, { once: true });
    });
    if (typeof ResizeObserver !== 'undefined') {
      document.querySelectorAll('[data-testimonials-marquee]').forEach(function (container) {
        new ResizeObserver(schedule).observe(container);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`

const TESTIMONIALS_CAROUSEL_INIT_SCRIPT = `
(function initTestimonialsCarousel() {
  var carousel = document.getElementById('testimonials-carousel');
  if (!carousel) return;
  var track = carousel.querySelector('.classic-testimonials-track');
  var dots = carousel.querySelectorAll('.classic-testimonials-dot');
  var slides = carousel.querySelectorAll('.classic-testimonials-slide');
  if (!track || slides.length <= 1) return;

  function isDesktop() {
    return window.innerWidth >= 1024;
  }

  if (!isDesktop()) {
    track.style.transform = 'none';
    slides.forEach(function(slide) {
      slide.style.flex = '0 0 auto';
      slide.style.width = '100%';
    });
    dots.forEach(function(dot) {
      dot.style.display = 'none';
    });
    return;
  }

  var index = 0;
  var timer;
  function goTo(i) {
    index = ((i % slides.length) + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach(function(dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === index);
    });
  }
  function next() { goTo(index + 1); }
  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 5000);
  }
  dots.forEach(function(dot, dotIndex) {
    dot.addEventListener('click', function() {
      goTo(dotIndex);
      resetTimer();
    });
  });
  goTo(0);
  resetTimer();

  window.addEventListener('resize', function() {
    if (!isDesktop()) {
      track.style.transform = 'none';
      slides.forEach(function(slide) {
        slide.style.flex = '0 0 auto';
        slide.style.width = '100%';
      });
      dots.forEach(function(dot) {
        dot.style.display = 'none';
      });
      if (timer) clearInterval(timer);
    } else {
      dots.forEach(function(dot) {
        dot.style.display = '';
      });
      goTo(0);
      resetTimer();
    }
  });
})();
`

const TESTIMONIALS_EQUAL_HEIGHT_SCRIPT = `

(function() {

  function equalizeTestimonialHeights() {

    var section = document.getElementById('testimonials');

    if (!section) return;

    var cards = section.querySelectorAll('.testimonial-thumb-card');

    if (!cards.length) return;

    for (var i = 0; i < cards.length; i++) {

      cards[i].style.minHeight = '';

    }

    var max = 0;

    for (var j = 0; j < cards.length; j++) {

      var h = cards[j].getBoundingClientRect().height;

      if (h > max) max = h;

    }

    max = Math.ceil(max);

    for (var k = 0; k < cards.length; k++) {

      cards[k].style.minHeight = max + 'px';

    }

  }

  var resizeTimer;

  function scheduleEqualize() {

    if (resizeTimer) clearTimeout(resizeTimer);

    resizeTimer = setTimeout(equalizeTestimonialHeights, 120);

  }

  window.addEventListener('load', equalizeTestimonialHeights);

  window.addEventListener('resize', scheduleEqualize);

  if (document.fonts && document.fonts.ready) {

    document.fonts.ready.then(equalizeTestimonialHeights);

  }

})();

`



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



function generateUnifiedGalleryGridHTML(

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



function generateRecentPhotosGridHTML(

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



function generatePortfolioCtaHTML(

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



interface PhotographerHomepageProps {

  photographer: Photographer

  galleries?: Gallery[]

  packages?: Package[]

  testimonials?: Testimonial[]

  postCount?: number

  blogPath?: string

  portfolioPath?: string

  studioPath?: string

  posts?: PublicBlogPost[]

}



export function PhotographerHomepage({ photographer, galleries = [], packages = [], testimonials = [], postCount = 0, blogPath, portfolioPath, studioPath, posts = [] }: PhotographerHomepageProps) {

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

      window.location.origin

    )

    setHtml(generatedHtml)

  }, [photographer, galleries, packages, testimonials, postCount, blogPath, portfolioPath, studioPath, posts])



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



function hexToRgb(hex: string): string {

  const normalized = hex.replace('#', '').trim()

  const value =

    normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized

  const int = Number.parseInt(value, 16)

  if (Number.isNaN(int)) return '184, 149, 63'

  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`

}



function underlineLastWord(text: string) {

  const trimmed = text.trim()

  if (!trimmed) return trimmed

  const words = trimmed.split(/\s+/)

  if (words.length === 1) {

    return `<span class="about-title-underline">${trimmed}</span>`

  }

  const lastWord = words.pop()!

  return `${words.join(' ')} <span class="about-title-underline">${lastWord}</span>`

}



function brandLastWord(text: string) {

  const trimmed = text.trim()

  if (!trimmed) return trimmed

  const words = trimmed.split(/\s+/)

  if (words.length === 1) {

    return `<span class="text-primary font-light">${trimmed}</span>`

  }

  const lastWord = words.pop()!

  return `${words.join(' ')} <span class="text-primary font-light">${lastWord}</span>`

}



function glassHeroTitle(text: string) {

  const trimmed = text.trim()

  if (!trimmed) return trimmed

  const words = trimmed.split(/\s+/)

  const lastIndex = words.length - 1

  const formatWords = (chunk: string[], offset: number) =>

    chunk

      .map((word, index) => {

        const safeWord = escapeHtml(word)

        if (offset + index === lastIndex) {

          return `<span class="text-primary">${safeWord}</span>`

        }

        return safeWord

      })

      .join(' ')

  const toLine = (chunk: string[], offset: number) =>

    `<span class="glass-hero-title__line">${formatWords(chunk, offset)}</span>`

  if (words.length <= 2) {

    return toLine(words, 0)

  }

  return toLine(words.slice(0, 2), 0) + toLine(words.slice(2), 2)

}



function escapeHtml(text: string): string {

  return String(text)

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;')

    .replace(/'/g, '&#39;')

}



function generatePhotographerDocumentHead(
  studioName: string,
  logoUrl: string | null,
  faviconOrigin?: string,
  userId?: string
): string {

  const title = escapeHtml(studioName)

  const faviconStoragePath =
    userId && logoUrl ? getBrandingFaviconStoragePath(userId, logoUrl) : null
  const publicFaviconPath = faviconStoragePath
    ? getBrandingPublicMediaPath(faviconStoragePath)
    : logoUrl
      ? getBrandingPublicMediaPath(logoUrl)
      : null
  const faviconHref =
    publicFaviconPath && faviconOrigin
      ? `${faviconOrigin.replace(/\/$/, '')}${publicFaviconPath}`
      : logoUrl

  const faviconLink = faviconHref

    ? `<link rel="icon" href="${escapeHtml(faviconHref)}" sizes="any"/>`

    : ''

  return `<title>${title}</title>\n${faviconLink}`

}



function generateContactPrivacyConsentHTML(

  theme: 'elegant' | 'modern' | 'classic' | 'dark',

  primaryColor: string,

  copy: HomepageCopy,

  wrapperClass = ''

): string {

  const labelTextClass = {

    elegant: 'text-sm font-light opacity-80 leading-relaxed',

    modern: 'text-sm text-white/90 leading-relaxed',

    classic: 'classic-contact-privacy-text text-sm text-on-surface-variant leading-relaxed block w-auto max-w-full m-0',

    dark: 'text-sm text-on-surface-variant leading-relaxed',

  }[theme]



  const privacyTextWrapperClass = theme === 'classic' ? 'flex-1 w-auto max-w-full' : 'flex-1 min-w-0'



  const privacyWrapperClass = [

    wrapperClass,

    theme === 'classic' ? 'classic-contact-privacy-consent' : '',

  ]

    .filter(Boolean)

    .join(' ')



  const linkClass = {

    elegant: 'underline hover:opacity-80',

    modern: 'underline text-white hover:opacity-80',

    classic: 'text-primary underline hover:opacity-80',

    dark: 'text-primary underline hover:opacity-80',

  }[theme]



  return `

<div class="contact-privacy-consent w-full min-w-0 flex flex-row items-start gap-sm text-start rtl:text-right ${privacyWrapperClass}">

<input type="checkbox" name="privacy_consent" id="contact_privacy_consent_${theme}" required class="contact-privacy-checkbox mt-1 shrink-0 size-4 cursor-pointer rounded border border-current/30" style="accent-color: ${primaryColor};"/>

<p class="${labelTextClass} ${privacyTextWrapperClass}">

<label for="contact_privacy_consent_${theme}" class="cursor-pointer">${copy.contactForm.privacyBefore}</label><a href="/privacy" class="${linkClass}">${copy.contactForm.privacyLink}</a>.

</p>

</div>`.trim()

}



function contactFormSubmitScript(photographerId: string, copy: HomepageCopy): string {

  return `

    (function() {

      var form = document.querySelector('#contact form');

      if (!form) return;

      form.addEventListener('submit', function(e) {

        e.preventDefault();

        if (!form.checkValidity()) {

          form.reportValidity();

          return;

        }

        var submitBtn = form.querySelector('button[type="submit"]');

        var originalLabel = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {

          submitBtn.disabled = true;

          submitBtn.textContent = '${copy.contactForm.submitting}';

        }

        var fd = new FormData(form);

        var payload = {

          photographerId: '${photographerId}',

          name: String(fd.get('name') || ''),

          email: String(fd.get('email') || ''),

          phone: String(fd.get('phone') || '') || undefined,

          subject: String(fd.get('subject') || '') || undefined,

          message: String(fd.get('message') || ''),

        };

        fetch('/api/contact-inquiry', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(payload),

        })

        .then(function(res) {

          return res.json().then(function(data) {

            return { ok: res.ok, data: data };

          });

        })

        .then(function(result) {

          if (!result.ok) throw new Error(result.data.error || '${copy.contactForm.submitError}');

          var section = document.querySelector('#contact .contact-section-content') || document.querySelector('#contact');

          if (section) {

            section.innerHTML = '<div class="text-center py-16"><p class="text-xl font-medium mb-2">${copy.contactForm.successTitle}</p><p class="opacity-70">${copy.contactForm.successBody}</p></div>';

          }

        })

        .catch(function(err) {

          alert(err.message || '${copy.contactForm.submitError}');

          if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerHTML = originalLabel;

          }

        });

      });

    })();

  `

}



function generateHomepageHTML(

  photographer: Photographer,

  theme: string,

  galleries: Gallery[],

  packages: Package[],

  testimonials: Testimonial[] = [],

  initialSection?: string | null,

  postCount: number = 0,

  blogPath?: string,

  portfolioPath?: string,

  studioPath?: string,

  posts: PublicBlogPost[] = [],

  faviconOrigin?: string

): string {

  const {

    id: photographerId,

    name,

    studio_name,

    logo_url,

    about_text,

    about_title,

    about_subtitle,

    should_color_logo,

    about_description,

    contact_card_title,

    contact_card_description,

    stat_projects,

    stat_clients,

    stat_experience_years,

    accent_color,

    hero_desktop_url,

    hero_mobile_url,

    hero_desktop_urls,

    hero_mobile_urls,

    about_image_url,

    contact_desktop_url,

    contact_mobile_url,

    packages_title,

    packages_subtitle,

    contact_title,

    contact_subtitle,

    testimonials_title,

    email,

    phone,

    address,

  } = photographer



  const siteLanguage = resolveSiteLanguage(photographer.site_language)

  const htmlAttrs = siteHtmlAttrs(siteLanguage)

  const homepageCopy = getHomepageCopy(siteLanguage)

  const contactAlign = contactTextAlignClass(siteLanguage)

  const contactLtrAlign = contactLtrFieldClass(siteLanguage)

  const contactLtrDir = contactLtrDirAttr()

  const contentDir = contentDirAttr(siteLanguage)

  const pkgCenterStyle =
    siteLanguage === 'en'
      ? 'text-align: center !important;'
      : 'direction: rtl !important; text-align: center !important;'

  const pkgListStyle =
    siteLanguage === 'en'
      ? 'text-align: center !important; padding-inline: 0 !important; margin-inline: 0 !important;'
      : 'direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;'

  const pkgListItemStyle =
    siteLanguage === 'en'
      ? 'text-align: center !important;'
      : 'direction: rtl !important; text-align: right !important;'



  const studioAddress = address?.trim() || null

  const studioAddressHtml = studioAddress ? escapeHtml(studioAddress) : ''

  const studioPhone = phone?.trim() || null

  const studioPhoneHtml = studioPhone ? escapeHtml(studioPhone) : ''

  const studioPhoneHref = studioPhone ? studioPhone.replace(/[^\d+]/g, '') : ''

  const contactEmail = email?.trim() || null

  const contactEmailHtml = contactEmail ? escapeHtml(contactEmail) : ''

  const contactDesktopUrl = contact_desktop_url || null

  const contactMobileUrl = contact_mobile_url || null

  const hasContactBg = !!(contactDesktopUrl || contactMobileUrl)



  const sectionBgCss = hasContactBg

    ? `

        .contact-section-has-bg {

            position: relative;

            overflow: hidden;

            width: 100%;

            max-width: none !important;

        }

        .contact-section-bg {

            position: absolute;

            top: 0;

            bottom: 0;

            left: 50%;

            width: 100vw;

            max-width: 100vw;

            margin-left: -50vw;

            z-index: 0;

            height: 100%;

            background-size: cover;

            background-position: center;

            background-repeat: no-repeat;

            pointer-events: none;

        }

        .contact-section-bg-desktop {

            display: none;

            opacity: 0.4;

            filter: brightness(1.45) saturate(0.68) contrast(0.9);

        }

        .contact-section-bg-mobile {

            display: block;

            opacity: 0.22;

            filter: brightness(1.65) saturate(0.62) contrast(0.88);

            -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.06) 52%, transparent 84%);

            mask-image: linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.06) 52%, transparent 84%);

        }

        @media (min-width: 768px) {

            .contact-section-bg-desktop { display: block; }

            .contact-section-bg-mobile { display: none; }

        }

        .contact-section-bg-overlay {

            position: absolute;

            top: 0;

            bottom: 0;

            left: 50%;

            width: 100vw;

            max-width: 100vw;

            margin-left: -50vw;

            z-index: 0;

            height: 100%;

            pointer-events: none;

        }

        @media (max-width: 767px) {

            .contact-section-bg-overlay {

                background: linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--contact-fade, #FAFAF8) 55%, transparent) 62%, var(--contact-fade, #FAFAF8) 94%);

            }

        }

        @media (min-width: 768px) {

            .contact-section-bg-overlay {

                background: linear-gradient(to bottom, color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fff)) 58%, transparent), color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fff)) 96%, transparent));

            }

        }

        .contact-section-content { position: relative; z-index: 1; }

    `

    : ''



  const sectionBgLayers = (

    enabled: boolean,

    desktopUrl: string | null,

    mobileUrl: string | null,

    mobileFade: string,

    desktopFade?: string

  ) => {

    if (!enabled) return ''

    const desktop = desktopUrl || mobileUrl

    const mobile = mobileUrl || desktopUrl

    const desktopFadeColor = desktopFade || mobileFade

    return `

      <div class="contact-section-bg contact-section-bg-desktop" style="background-image:url('${desktop}')"></div>

      <div class="contact-section-bg contact-section-bg-mobile" style="background-image:url('${mobile}')"></div>

      <div class="contact-section-bg-overlay" style="--contact-fade:${mobileFade};--contact-fade-desktop:${desktopFadeColor}"></div>

    `

  }



  const contactBgLayers = (mobileFade: string, desktopFade?: string) =>

    sectionBgLayers(hasContactBg, contactDesktopUrl, contactMobileUrl, mobileFade, desktopFade)



  const primaryColor = accent_color || '#B8953F'

  const primaryColorRgb = hexToRgb(primaryColor)

  const aboutHollowTitleAmbientShadow = `0 4px 12px rgba(${primaryColorRgb}, 0.25)`

  const elegantPackagesGlowHtml = `<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70" aria-hidden="true"></div>`

  const faqAmbientGlowHtml = `<div class="faq-section-glow faq-section-glow--left" style="background:radial-gradient(circle, rgba(${primaryColorRgb}, 0.3) 0%, rgba(${primaryColorRgb}, 0.16) 36%, rgba(${primaryColorRgb}, 0.06) 62%, transparent 84%);" aria-hidden="true"></div><div class="faq-section-glow faq-section-glow--right" style="background:radial-gradient(circle, rgba(${primaryColorRgb}, 0.18) 0%, rgba(${primaryColorRgb}, 0.08) 38%, rgba(${primaryColorRgb}, 0.03) 64%, transparent 86%);" aria-hidden="true"></div>`

  const aboutAmbientBackgroundHtml =

    theme === 'elegant'

      ? elegantPackagesGlowHtml

      : theme === 'classic' || theme === 'dark'

        ? `<div class="about-glow about-glow-left" style="background: radial-gradient(circle, ${primaryColor}70 0%, ${primaryColor}45 24%, ${primaryColor}22 46%, transparent 72%);" aria-hidden="true"></div>

<div class="about-glow about-glow-right" style="background: radial-gradient(circle, ${primaryColor}80 0%, ${primaryColor}50 26%, ${primaryColor}28 48%, transparent 74%);" aria-hidden="true"></div>`

        : ''

  const isPortfolioMode = (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'

  const heroGalleryAnchor = isPortfolioMode
    ? '#recent-photos'
    : theme === 'modern'
      ? '#portfolio'
      : theme === 'classic'
        ? '#galleries'
        : '#gallery'

  const portfolioCtaHtml =

    isPortfolioMode &&

    portfolioPath &&

    galleries.some((g) => (g.photo_pool?.length ?? 0) > 0)

      ? generatePortfolioCtaHTML(

          portfolioPath,

          primaryColor,

          siteLanguage,

        )

      : ''

  const desktopHeroImages = normalizeHeroUrlList(hero_desktop_urls, hero_desktop_url)

  const mobileHeroImages = normalizeHeroUrlList(

    hero_mobile_urls,

    hero_mobile_url,

    desktopHeroImages[0] ?? null

  )

  const heroSlideshowHtml = generateHeroSlideshowHTML({

    desktopImages: desktopHeroImages,

    mobileImages: mobileHeroImages,

    alt: studio_name || homepageCopy.misc.photographyAlt,

  })

  const heroSlideshowModernHtml = generateModernHeroFilmBeltHTML({

    desktopImages: desktopHeroImages,

    mobileImages: mobileHeroImages,

    alt: studio_name || homepageCopy.misc.photographyAlt,

    heroId: 'hero-slideshow-modern',

  })

  const heroSlideshowBoldHtml = generateHeroSlideshowHTML({

    desktopImages: desktopHeroImages,

    mobileImages: mobileHeroImages,

    alt: studio_name || homepageCopy.misc.photographyAlt,

    heroId: 'hero-slideshow-bold',

    imgClass: 'bold-hero-image',

  })

  const aboutImageHtml = about_image_url

    ? `<img alt="${homepageCopy.misc.portraitAlt}" class="w-full h-full object-cover" src="${about_image_url}"/>`

    : ''



  const studioName = studio_name || name || 'סטודיו גלריה'

  const blogModalHeadBlock =
    posts.length > 0 ? buildHomepageBlogModalHeadBlock(primaryColor) : ''

  const documentHead =
    generatePhotographerDocumentHead(
      studioName,
      logo_url,
      faviconOrigin,
      photographerId
    ) + blogModalHeadBlock

  const photographerName = name || 'אפרת כהן'

  const validFaqItems = sanitizeFaqItems(parseFaqItems(photographer.faq_items))

  const faqSectionImageUrl = photographer.faq_section_image_url?.trim() || null

  const faqSectionWithImageClass = faqSectionImageUrl ? ' faq-section--with-image' : ''

  const faqSectionWithImageStyle = faqSectionImageUrl

    ? ` style="--faq-section-bg-image: url('${faqSectionImageUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')"`

    : ''

  const hasFaq = validFaqItems.length > 0

  const sectionScrollScript = generateHomepageSectionScrollScript(initialSection)



  const resolvedStudioPath = studioPath ?? blogPath?.replace(/\/blog$/, '') ?? '/'
  const resolvedBlogPath = blogPath ?? `${resolvedStudioPath}/blog`

  const siteChrome = (themeKey: SiteChromeTheme) =>

    buildPublicSiteChrome({

      theme: themeKey,

      studioName,

      logoUrl: logo_url,

      primaryColor,

      homepagePath: resolvedStudioPath,

      linkMode: 'scroll',

      shouldColorLogo: photographer.should_color_logo ?? false,

      hasFaq,

      hasPackages: packages.length > 0,

      hasBlog: postCount > 0,

      blogPath: postCount > 0 ? resolvedBlogPath : undefined,

      galleryLayoutMode:
        (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'
          ? 'portfolio'
          : 'separated',

      portfolioPath:
        (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'
          ? portfolioPath
          : undefined,

      siteLanguage: photographer.site_language,

    })

  const postsSectionHtml = generateHomepagePostsSectionHTML({
    posts,
    theme: theme as SiteChromeTheme,
    primaryColor,
    sectionTitle: resolvePostsPageTitle(theme, photographer.posts_page_title, siteLanguage),
    blogHref: blogPath ?? '#',
    studioPath: studioPath ?? blogPath?.replace(/\/blog$/, '') ?? '/',
    showAllLink: postCount > 0,
    language: siteLanguage,
  })

  const aboutText = about_text || ''
  const aboutTextHtml = escapeHtml(aboutText.trim())

  const aboutTitle = about_title || ''

  const aboutSubtitle = about_subtitle || ''

  const aboutDescription = about_description || ''

  const contactCardTitle = contact_card_title || ''

  const contactCardDescription = contact_card_description || ''



  const statsProjects = stat_projects ?? 0

  const statsClients = stat_clients ?? 0

  const statsYears = stat_experience_years ?? 0

  const hasStats = statsProjects > 0 || statsClients > 0 || statsYears > 0

  const hasPackages = packages.length > 0

  const packagesSectionCopy = resolvePackagesSectionCopy(theme, packages_title, packages_subtitle, siteLanguage)

  const contactSectionCopy = resolveContactSectionCopy(theme, contact_title, contact_subtitle, siteLanguage)

  const packagesGridClass =

    packages.length === 1

      ? 'homepage-packages-grid homepage-packages-grid--count-1'

      : packages.length === 2

        ? 'homepage-packages-grid homepage-packages-grid--count-2'

        : 'homepage-packages-grid'

  
  // Sort packages: if there are exactly 3 packages and one is featured, place it in the middle
  const sortedPackages = (() => {
    if (packages.length === 3) {
      const featuredIndex = packages.findIndex(pkg => pkg.is_featured)
      if (featuredIndex !== -1) {
        // Create a copy and move featured package to middle position (index 1)
        const packagesCopy = [...packages]
        const [featured] = packagesCopy.splice(featuredIndex, 1)
        packagesCopy.splice(1, 0, featured)
        return packagesCopy
      }
    }
    return packages
  })()
  
  const hasTestimonials = testimonials.length > 0

  const testimonialsSectionTitle = resolveTestimonialsSectionTitle(

    theme,

    testimonials_title,

    siteLanguage

  )

  const testimonialsSectionSubtitle = resolveTestimonialsSectionSubtitle(theme, siteLanguage)

  const formatStat = (value: number) => (value > 0 ? `${value}+` : `${value}`)



  // Generate dynamic packages HTML for each theme

  const packageCardBg = (solidClass: string) => solidClass



  const generatePackagesHTML = (currentTheme: string) => {

    if (packages.length === 0) return ''

    const packageList = currentTheme === 'classic' || currentTheme === 'dark' ? packages : sortedPackages

    

    return packageList.map((pkg, i) => {

      const includesList = pkg.includes || [];

      const isFeatured = pkg.is_featured;

      

      if (currentTheme === 'elegant') {

        return `

        <div class="stagger-reveal homepage-package-reveal" data-reveal-delay="${i * 100}">

        <div class="${isFeatured ? `${packageCardBg('bg-white')} border-2` : `${packageCardBg('bg-white')} border border-outline-variant`} p-10 flex flex-col h-full relative" style="${pkgCenterStyle} ${isFeatured ? `border-color: ${primaryColor};` : ''}">

          ${isFeatured ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-lg" style="${pkgCenterStyle} background-color: ${primaryColor};">${homepageCopy.packages.bestSeller}</div>` : ''}

          <div class="text-center mb-8 ${isFeatured ? 'mt-2' : ''}" style="${pkgCenterStyle}">

            <h3 class="font-display text-3xl mb-2" style="${pkgCenterStyle} color: ${primaryColor};">${pkg.name}</h3>

            <div class="text-lg tracking-widest elegant-accent" style="${pkgCenterStyle} color: ${isFeatured ? primaryColor : 'inherit'};">₪${pkg.price_amount}</div>

          </div>

          <div class="border-t pt-8 mb-10 flex-grow" style="${pkgCenterStyle} ${isFeatured ? `border-color: ${primaryColor}20;` : 'border-color: rgba(15, 15, 13, 0.1);'}">

            <div class="mx-auto w-fit">

              <ul class="space-y-4 font-body text-base ${isFeatured ? 'text-on-surface-variant' : 'opacity-80'}" style="${pkgListStyle}">

                ${includesList.map((item: string) => `<li style="${pkgListItemStyle}" class="flex flex-row items-center justify-start gap-4 w-full"><span class="material-symbols-outlined text-xl" style="color: ${primaryColor};">check</span> <span>${item}</span></li>`).join('')}

              </ul>

            </div>

          </div>

          <div class="mt-auto" style="${pkgCenterStyle}">

            <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full border border-[#0F0F0D] px-8 py-4 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all" style="${pkgCenterStyle}">${homepageCopy.packages.scheduleConsultation}</button>

          </div>

        </div>

        </div>

      `;

      } else if (currentTheme === 'modern') {

        return `

        <div class="stagger-reveal homepage-package-reveal" data-reveal-delay="${i * 100}">

        <div class="${packageCardBg('bg-white')} p-xl rounded-2xl modern-shadow border border-outline-variant flex flex-col gap-md transition-all hover:-translate-y-2 ${isFeatured ? 'border-2 border-primary' : ''}" style="${pkgCenterStyle}">

          ${isFeatured ? `<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-lg py-1 rounded-full text-xs font-bold uppercase tracking-wider" style="${pkgCenterStyle}">${homepageCopy.packages.bestSeller}</div>` : ''}

          <div style="${pkgCenterStyle}">

            <h3 class="font-headline text-2xl font-bold text-primary" style="${pkgCenterStyle}">${pkg.name}</h3>

            <div class="flex items-baseline gap-xs mt-sm justify-center" style="${pkgCenterStyle}">

              <span class="font-headline text-3xl font-bold text-primary">₪${pkg.price_amount}</span>

            </div>

          </div>

          <div class="mx-auto w-fit flex-grow my-lg">

            <ul class="flex flex-col gap-md" style="${pkgListStyle}">

              ${includesList.map((item: string) => `<li style="${pkgListItemStyle}" class="flex flex-row items-center justify-start gap-sm text-md"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> <span>${item}</span></li>`).join('')}

            </ul>

          </div>

          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full py-md ${isFeatured ? 'bg-primary text-white rounded-lg font-bold btn-magnetic shadow-lg shadow-indigo-100' : 'border border-primary text-primary rounded-lg font-bold btn-magnetic hover:bg-primary/5'} transition-all" style="${pkgCenterStyle}">

            ${homepageCopy.packages.orderNow}

          </button>

        </div>

        </div>

      `;

      } else if (currentTheme === 'classic' || currentTheme === 'dark') {

        const subtitle = pkg.duration_text || (isFeatured ? homepageCopy.packages.fullExperience : homepageCopy.packages.smallMoments)

        return `

        <div class="homepage-packages-row stagger-reveal${isFeatured ? ' homepage-packages-row--featured' : ''}" data-reveal-delay="${i * 100}" style="--primary-color: ${primaryColor};">

          <div class="homepage-packages-row__title">

            ${isFeatured ? `<span class="homepage-packages-row__badge">${homepageCopy.packages.bestSeller}</span>` : ''}

            <h3 class="font-headline-sm text-headline-sm text-primary mb-xs">${pkg.name}</h3>

            <p class="font-body-md text-body-md text-on-surface-variant/60">${subtitle}</p>

          </div>

          <div class="homepage-packages-row__features" ${contentDir}>

            <ul class="homepage-packages-row__features-grid">

              ${includesList.map((item: string) => `<li><span class="material-symbols-outlined">${isFeatured ? 'check_circle' : 'check'}</span><span>${item}</span></li>`).join('')}

            </ul>

          </div>

          <div class="homepage-packages-row__action">

            <div class="homepage-packages-row__price"><span class="homepage-packages-row__price-currency">₪</span>${pkg.price_amount}</div>

            <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="homepage-packages-row__btn ${isFeatured ? 'homepage-packages-row__btn--featured' : 'homepage-packages-row__btn--default'}">

              ${isFeatured ? homepageCopy.packages.selectPackage : homepageCopy.packages.orderPackage}

            </button>

          </div>

        </div>

      `;

      }

      return '';

    }).join('');

  };



  const elegantSectionHeading = (

    title: string,

    watermark: string,

    opts?: { center?: boolean; onDark?: boolean; titleClass?: string; wrapperClass?: string }

  ) => {

    const center = opts?.center ?? false

    const onDark = opts?.onDark ?? false

    const titleClass = opts?.titleClass ?? ''

    const wrapperClass = opts?.wrapperClass ?? ''

    const classes = [

      'elegant-section-heading',

      center ? 'elegant-section-heading--center' : '',

      onDark ? 'elegant-section-heading--on-dark' : '',

      wrapperClass,

    ]

      .filter(Boolean)

      .join(' ')

    return `

      <div class="${classes}">

        <span class="elegant-section-heading__watermark" aria-hidden="true">${escapeHtml(watermark)}</span>

        <h2 class="elegant-section-heading__title text-3xl md:text-4xl${titleClass ? ` ${titleClass}` : ''}">${escapeHtml(title)}</h2>

      </div>

    `

  }



  const generateFaqAccordionHTML = (currentTheme: string) => {

    if (currentTheme === 'modern' || currentTheme === 'dark') {

      const renderModernItem = (item: FaqItem) =>

        `<details class="faq-item faq-item--modern">

<summary class="faq-item__summary">

<span class="faq-item__question">${escapeHtml(item.question)}</span>

<span class="faq-item__toggle" aria-hidden="true"></span>

</summary>

<div class="faq-answer">${escapeHtml(item.answer)}</div>

</details>`

      const rightColumnItems = validFaqItems.filter((_, index) => index % 2 === 0)

      const leftColumnItems = validFaqItems.filter((_, index) => index % 2 === 1)

      return `<div class="faq-accordion faq-accordion--modern">

<div class="faq-accordion__column faq-accordion__column--start">

${rightColumnItems.map(renderModernItem).join('')}

</div>

<div class="faq-accordion__column faq-accordion__column--end">

${leftColumnItems.map(renderModernItem).join('')}

</div>

</div>`

    }

    return validFaqItems

      .map((item) => {

        const darkClass = currentTheme === 'dark' ? ' faq-item--dark' : ''

        return `<details class="faq-item${darkClass}">

<summary>${escapeHtml(item.question)}</summary>

<div class="faq-answer">${escapeHtml(item.answer)}</div>

</details>`

      })

      .join('')

  }



  const generateMagazineFaqItemsHTML = (variant: 'elegant' | 'classic', includeFeatured = true) =>

    validFaqItems

      .map((item, index) => {

        const revealClass = variant === 'elegant' ? 'reveal-on-scroll' : 'reveal'

        const featuredClass = includeFeatured && index === 0 ? ' faq-magazine-item--featured' : ''

        const indexLabel = String(index + 1).padStart(2, '0')



        return `<article class="faq-magazine-item${featuredClass} ${revealClass}" style="transition-delay: ${index * 80}ms">

<div class="faq-magazine-item__heading">

<span class="faq-magazine-item__number" aria-hidden="true">${indexLabel}</span>

<h3 class="faq-magazine-item__question">${escapeHtml(item.question)}</h3>

</div>

<p class="faq-magazine-item__answer">${escapeHtml(item.answer)}</p>

</article>`

      })

      .join('')



  const generateMagazineFaqBodyHTML = (variant: 'elegant' | 'classic') => {

    const revealClass = variant === 'elegant' ? 'reveal-on-scroll' : 'reveal'

    const withImage = Boolean(faqSectionImageUrl)

    const itemsHtml = generateMagazineFaqItemsHTML(variant, !withImage)



    if (!withImage) {

      return `<div class="faq-magazine-grid">${itemsHtml}</div>`

    }



    return `<div class="faq-magazine-layout faq-magazine-layout--with-image">

<div class="faq-magazine-content">

<div class="faq-magazine-grid faq-magazine-grid--stacked">${itemsHtml}</div>

</div>

<div class="faq-magazine-feature ${revealClass}">

<img src="${faqSectionImageUrl}" alt="" class="faq-magazine-feature__image" loading="lazy" decoding="async"/>

</div>

</div>`

  }



  const generateContactDetailsHTML = (variant: 'elegant' | 'bold') => {

    const prefix = variant === 'elegant' ? 'elegant' : 'bold'

    const revealClass = variant === 'elegant' ? 'reveal-on-scroll' : 'reveal'

    const linkHoverClass =

      variant === 'elegant'

        ? 'hover:text-white transition-colors'

        : 'hover:text-primary transition-colors'

    const items: string[] = []



    if (studioPhone) {

      items.push(`<div class="${prefix}-contact-details__item">

<span class="material-symbols-outlined ${prefix}-contact-details__icon">call</span>

<span class="${prefix}-contact-details__label">${homepageCopy.contactDetails.phone}</span>

<a href="tel:${studioPhoneHref}" class="${prefix}-contact-details__value ${linkHoverClass}" dir="ltr">${studioPhoneHtml}</a>

</div>`)

    }



    if (contactEmail) {

      items.push(`<div class="${prefix}-contact-details__item">

<span class="material-symbols-outlined ${prefix}-contact-details__icon">mail</span>

<span class="${prefix}-contact-details__label">${homepageCopy.contactDetails.email}</span>

<a href="mailto:${contactEmailHtml}" class="${prefix}-contact-details__value ${linkHoverClass}">${contactEmailHtml}</a>

</div>`)

    }



    if (studioAddress) {

      items.push(`<div class="${prefix}-contact-details__item">

<span class="material-symbols-outlined ${prefix}-contact-details__icon">location_on</span>

<span class="${prefix}-contact-details__label">${homepageCopy.contactDetails.location}</span>

<span class="${prefix}-contact-details__value">${studioAddressHtml}</span>

</div>`)

    }



    if (items.length === 0) return ''



    return `<div class="${prefix}-contact-details mt-16 mx-auto max-w-3xl px-8 py-10 md:px-12 ${revealClass}">

<div class="flex flex-wrap justify-center gap-10 md:gap-16">${items.join('')}</div>

</div>`

  }



  const generateElegantContactDetailsHTML = () => generateContactDetailsHTML('elegant')

  const generateBoldContactDetailsHTML = () => generateContactDetailsHTML('bold')



  const generateFaqSectionHTML = (currentTheme: string) => {

    if (!hasFaq) return ''



    const accordion = `<div class="faq-accordion">${generateFaqAccordionHTML(currentTheme)}</div>`



    if (currentTheme === 'elegant') {

      return `<section class="faq-section pt-8 pb-16 md:pt-12 md:pb-32 reveal-on-scroll${faqSectionWithImageClass}" id="faq"${faqSectionWithImageStyle}>

<div class="faq-section__header reveal-on-scroll">

${elegantSectionHeading(homepageCopy.sections.faq, 'FAQ')}

<p class="font-body opacity-60 italic faq-section__subtitle">${homepageCopy.sections.faqSubtitle}</p>

</div>

<div class="faq-magazine-wrap">

${generateMagazineFaqBodyHTML('elegant')}

</div>

</section>`

    }



    if (currentTheme === 'modern') {

      return `<section class="faq-section pt-lg pb-xxl w-full reveal-on-scroll relative" id="faq">

${faqAmbientGlowHtml}

<div class="max-w-7xl mx-auto px-lg relative z-10">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

<h2 class="font-headline text-4xl font-bold text-on-surface mb-sm">${homepageCopy.sections.faq}</h2>

<p class="modern-section-subtitle">${homepageCopy.sections.faqSubtitle}</p>

</div>

${generateFaqAccordionHTML('modern')}

</div>

</section>`

    }



    if (currentTheme === 'dark') {

      return `<section class="faq-section pt-lg pb-xxl w-full reveal relative" id="faq">

${faqAmbientGlowHtml}

<div class="max-w-7xl mx-auto px-lg relative z-10">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

<h2 class="font-headline text-4xl font-bold text-on-surface mb-sm">${homepageCopy.sections.faq}</h2>

<p class="modern-section-subtitle opacity-70">${homepageCopy.sections.faqSubtitle}</p>

</div>

${generateFaqAccordionHTML('dark')}

</div>

</section>`

    }



    if (currentTheme === 'classic') {

      return `<section class="faq-section py-xxl reveal${faqSectionWithImageClass}" id="faq"${faqSectionWithImageStyle}>

<div class="faq-section__header stagger-reveal" data-reveal-delay="0">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">FAQ</span>

<h2 class="font-headline-md text-headline-md text-on-surface">${homepageCopy.sections.faq}</h2>

<div class="faq-section__divider w-12 h-px bg-outline-variant mt-md"></div>

<p class="font-body-md text-body-md text-on-surface-variant mt-md faq-section__subtitle">${homepageCopy.sections.faqSubtitle}</p>

</div>

<div class="faq-magazine-wrap">

${generateMagazineFaqBodyHTML('classic')}

</div>

</section>`

    }



    return `<section class="faq-section py-xl md:py-xxl container mx-auto px-lg reveal" id="faq">

<div class="text-center mb-xl md:mb-xxl">

<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">FAQ</span>

<h2 class="font-headline-md text-headline-md">${homepageCopy.sections.faq}</h2>

<p class="font-body-md text-on-surface-variant opacity-70 mt-md">${homepageCopy.sections.faqSubtitle}</p>

</div>

${accordion}

</section>`

  }



  const formatReviewDate = (t: Testimonial) => {

    const raw = t.review_date || t.created_at

    if (!raw) return ''

    const d = new Date(raw)

    if (isNaN(d.getTime())) return ''

    return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })

  }



  // Build the "meta" subtitle line (shoot type · date) for a testimonial

  const testimonialMeta = (t: Testimonial) => {

    const shoot = t.shoot_type ? escapeHtml(t.shoot_type) : ''

    const date = formatReviewDate(t)

    return [shoot, date].filter(Boolean).join(' · ')

  }



  // Generate dynamic testimonials HTML for each theme.

  const testimonialThumbSrc = (t: Testimonial) => escapeHtml(t.image_url || logo_url || '')



  const generateTestimonialThumbCard = (

    t: Testimonial,

    variant: 'classic' | 'elegant' | 'modern' | 'dark',

    options?: { delayAttr?: string; extraClass?: string; forMarquee?: boolean }

  ) => {

    const title = escapeHtml(t.title)

    const content = escapeHtml(t.content)

    const meta = testimonialMeta(t)

    const thumbSrc = testimonialThumbSrc(t)

    const forMarquee = options?.forMarquee ?? false

    const delayAttr = forMarquee ? '' : (options?.delayAttr ?? '')

    const extraClass = forMarquee ? '' : (options?.extraClass ?? '')



    const thumbHtml = thumbSrc

      ? `<div class="testimonial-thumb-card__thumb"><img src="${thumbSrc}" alt="" loading="lazy"/></div>`

      : ''



    const quoteHtml = `<span class="testimonial-thumb-card__quote material-symbols-outlined" style="color: ${primaryColor};">format_quote</span>`



    if (variant === 'classic' || variant === 'modern' || variant === 'dark') {

      const themeModifier =
        variant === 'classic'
          ? 'testimonial-thumb-card--classic'
          : variant === 'modern'
            ? 'testimonial-thumb-card--modern'
            : 'testimonial-thumb-card--dark'

      return `

        <div class="testimonial-thumb-card testimonial-thumb-card--classic classic-testimonial-card ${themeModifier} italic${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>

          ${quoteHtml}

          ${thumbHtml}

          <div class="testimonial-thumb-card__content">

            ${title ? `<h4 class="font-headline-sm text-headline-sm text-on-surface mb-md not-italic">${title}</h4>` : ''}

            <p class="testimonial-thumb-card__text font-body-lg text-body-lg text-on-surface-variant mb-lg leading-relaxed">${content}</p>

            ${meta ? `<div class="testimonial-thumb-card__footer font-label-sm text-label-sm text-primary font-bold not-italic">${meta}</div>` : ''}

          </div>

        </div>

      `

    }



    if (variant === 'elegant') {

      return `

        <div class="testimonial-thumb-card testimonial-thumb-card--elegant flex flex-col justify-between${forMarquee ? '' : ' reveal-on-scroll'}${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>

          ${quoteHtml}

          ${thumbHtml}

          <div class="testimonial-thumb-card__content">

            <div>

              <div class="flex flex-row rtl:flex-row-reverse gap-1 text-accent mb-6">

                <span class="material-symbols-outlined fill-1">star</span>

                <span class="material-symbols-outlined fill-1">star</span>

                <span class="material-symbols-outlined fill-1">star</span>

                <span class="material-symbols-outlined fill-1">star</span>

                <span class="material-symbols-outlined fill-1">star</span>

              </div>

              <p class="testimonial-thumb-card__text font-body text-lg italic opacity-80 leading-relaxed mb-8">${content}</p>

            </div>

            <div class="testimonial-thumb-card__footer">

              <h4 class="font-display text-xl mb-1">${title}</h4>

              ${meta ? `<p class="text-xs uppercase tracking-widest opacity-40">${meta}</p>` : ''}

            </div>

          </div>

        </div>

      `

    }

    return ''

  }



  function generateThemeTestimonialCard(
    t: Testimonial,
    theme: 'classic' | 'elegant' | 'modern' | 'dark',
    index: number,
    options?: { forMarquee?: boolean }
  ) {
    if (options?.forMarquee) {
      return generateTestimonialThumbCard(t, theme, { forMarquee: true })
    }
    if (theme === 'elegant') {
      const delay = index > 0 ? ` style="transition-delay: ${index * 150}ms;"` : ''
      return generateTestimonialThumbCard(t, 'elegant', { delayAttr: delay })
    }
    if (theme === 'modern') {
      const delayClass = index > 0 ? ` delay-${Math.min(index * 100, 300)}` : ''
      return generateTestimonialThumbCard(t, 'modern', { extraClass: delayClass })
    }
    return generateTestimonialThumbCard(t, theme)
  }

  function generateTestimonialsCarouselHTML(theme: 'classic' | 'elegant' | 'modern' | 'dark') {
    const wrapBleed = (inner: string) => `<div class="testimonials-bleed">${inner}</div>`

    if (testimonials.length <= 3) {
      const cardsHtml = testimonials
        .map((t, i) => generateThemeTestimonialCard(t, theme, i))
        .join('')
      return wrapBleed(`
    <div class="testimonials-row">
      ${cardsHtml}
    </div>`)
    }

    const slides: Testimonial[][] = []
    for (let i = 0; i < testimonials.length - 2; i++) {
      slides.push(testimonials.slice(i, i + 3))
    }

    const slidesHtml = slides
      .map(
        (slide) => `
    <div class="classic-testimonials-slide">
      <div class="testimonials-row">
        ${slide.map((t, i) => generateThemeTestimonialCard(t, theme, i)).join('')}
      </div>
    </div>`
      )
      .join('')

    const dotsHtml = `
    <div class="classic-testimonials-dots">
      ${slides
        .map(
          (_, i) =>
            `<button type="button" class="classic-testimonials-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="${homepageCopy.misc.testimonialPage} ${i + 1}"></button>`
        )
        .join('')}
    </div>`

    return wrapBleed(`
    <div class="classic-testimonials-carousel" id="testimonials-carousel">
      <div class="classic-testimonials-track">${slidesHtml}</div>
      ${dotsHtml}
    </div>`)
  }

  function generateTestimonialsSection(theme: 'classic' | 'elegant' | 'modern' | 'dark') {
    if (testimonials.length === 0) return ''

    if (photographer.testimonial_layout_type === 'marquee') {
      const cardsHtml = testimonials
        .map((t, i) => generateThemeTestimonialCard(t, theme, i, { forMarquee: true }))
        .join('')
      return generateTestimonialsMarqueeHTML(cardsHtml)
    }

    return generateTestimonialsCarouselHTML(theme)
  }


  function generateTestimonialsMarqueeHTML(cardsHtml: string) {
    // Two identical, contiguous sets with a uniform gap. The init script measures
    // the pixel distance between them and animates by exactly that amount, so the
    // loop seam is invisible. Track flows LTR (anchored left) to avoid the RTL
    // "empties on scroll" bug; each card keeps RTL text.
    return `
    <div class="testimonials-bleed">
    <div class="testimonials-marquee" data-testimonials-marquee>
      <div class="testimonials-marquee-track">
        <div class="testimonials-marquee-set">${cardsHtml}</div>
        <div class="testimonials-marquee-set" aria-hidden="true">${cardsHtml}</div>
      </div>
    </div>
    </div>`
  }



  // ELEGANT THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA

  const ElegantTheme = () => `

<!DOCTYPE html>

<html class="scroll-smooth" ${htmlAttrs} style="scroll-behavior: smooth;">

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<script id="tailwind-config">

      tailwind.config = {

        darkMode: "class",

        theme: {

          extend: {

            "colors": {

                    "primary": "${primaryColor}",

                    "secondary": "#675c57",

                    "tertiary": "#81533f",

                    "background": "#FAFAF8",

                    "surface": "#fdf8f7",

                    "accent": "${primaryColor}",

                    "on-surface": "#1c1b1b",

                    "on-surface-variant": "#464742",

                    "outline": "#767871",

                    "outline-variant": "#c7c7c0",

                    "surface-container-low": "#f7f3f2",

                    "surface-container-high": "#ebe7e6",

                    "surface-container-highest": "#e5e2e1"

            },

            "borderRadius": {

                    "DEFAULT": "0px",

                    "lg": "0px",

                    "xl": "0px"

            },

            "spacing": {

                    "lg": "24px",

                    "margin-mobile": "16px",

                    "md": "16px",

                    "gutter": "24px",

                    "margin-desktop": "64px",

                    "xl": "32px"

            },

            "fontFamily": {

                    "display": ["Playfair Display", "serif"],

                    "body": ["Heebo", "sans-serif"],

                    "serif-hebrew": ["Frank Ruhl Libre", "serif"]

            }

          },

        },

      }

    </script>

<style>

        body {

            background-color: #FAFAF8;

            color: #0F0F0D;

            font-family: 'Heebo', sans-serif;

            overflow-x: hidden;

        }

        

        .elegant-accent { color: ${primaryColor}; }

        .elegant-bg-accent { background-color: ${primaryColor}; }

        .elegant-border-accent { border-color: ${primaryColor}; }



        .elegant-contact-details {

            backdrop-filter: blur(2px);

        }

        .elegant-contact-details__item {

            display: flex;

            flex-direction: column;

            align-items: center;

            gap: 0.75rem;

            min-width: 8.75rem;

            text-align: center;

        }

        .elegant-contact-details__icon {

            font-size: 1.75rem;

            color: ${primaryColor};

        }

        .elegant-contact-details__label {

            font-size: 10px;

            text-transform: uppercase;

            letter-spacing: 0.2em;

            opacity: 0.4;

        }

        .elegant-contact-details__value {

            font-weight: 300;

            opacity: 0.75;

            font-size: 0.95rem;

            line-height: 1.5;

            max-width: 14rem;

        }



        .elegant-section-heading {

            display: inline-grid;

            justify-items: center;

            align-items: last baseline;

            max-width: 100%;

        }

        .elegant-section-heading--center {

            display: grid;

            width: 100%;

            text-align: center;

        }

        .elegant-section-heading__watermark,

        .elegant-section-heading__title {

            grid-area: 1 / 1;

            margin: 0;

            padding: 0;

            line-height: 1;

        }

        .elegant-section-heading__watermark {

            font-family: 'Heebo', sans-serif;

            font-size: clamp(1.5rem, 5.4vw, 4rem);

            font-weight: 700;

            letter-spacing: 0.04em;

            text-transform: uppercase;

            color: ${primaryColor};

            opacity: 0.14;

            white-space: nowrap;

            pointer-events: none;

            user-select: none;

            z-index: 0;

        }

        .elegant-section-heading__title {

            position: relative;

            z-index: 1;

            font-family: 'Heebo', sans-serif;

            font-weight: 500;

        }

        .elegant-section-heading--on-dark .elegant-section-heading__watermark {

            opacity: 0.2;

        }

        @media (max-width: 767px) {

            .elegant-section-heading {

                display: grid;

                width: 100%;

                text-align: center;

            }

            .elegant-section-heading__watermark {

                font-size: clamp(2.35rem, 9vw, 4rem);

                letter-spacing: 0.03em;

            }

            .homepage-gallery-header > div,

            .recent-photos-header > div {

                justify-content: flex-start !important;

                align-items: flex-end !important;

                display: flex;

                flex-direction: column;

                text-align: right !important;

            }

            #about .grid {

                justify-items: center;

                text-align: center;

            }

            #about .grid > div {

                display: flex;

                flex-direction: column;

                align-items: center;

                text-align: center;

                width: 100%;

            }

            #about .grid > div.order-1 {

                width: calc(100vw - 1.25rem);

                max-width: calc(100vw - 1.25rem);

                margin-inline: calc(50% - 50vw + 0.625rem);

            }

            #about .image-reveal {

                width: 100%;

                max-width: none;

                aspect-ratio: 3 / 4;

                min-height: 72vw;

            }

        }

        

        .glass-hero-wrapper {

            position: absolute;

            z-index: 100;

            top: auto;

            bottom: 4.5rem;

            left: 2rem;

            transform: none;

            width: 100%;

            max-width: 28rem;

        }

        .glass-hero-wrapper::before {

            content: '';

            position: absolute;

            inset: -25% -20%;

            background: radial-gradient(ellipse at 50% 55%, color-mix(in srgb, ${primaryColor} 28%, transparent) 0%, transparent 72%);

            filter: blur(28px);

            z-index: -1;

            pointer-events: none;

            opacity: 0.6;

        }

        .glass-hero {

            position: relative;

            overflow: hidden;

            background: linear-gradient(165deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 52%, rgba(255, 255, 255, 0.06) 100%);

            backdrop-filter: blur(20px) saturate(1.2);

            -webkit-backdrop-filter: blur(20px) saturate(1.2);

            border: 1px solid rgba(255, 255, 255, 0.18);

            border-radius: 16px;

            box-shadow:

                0 24px 70px rgba(0, 0, 0, 0.14),

                0 10px 28px rgba(0, 0, 0, 0.06),

                inset 0 1px 1px rgba(255, 255, 255, 0.22);

            animation: gentleFloat 6s ease-in-out infinite;

            width: 100%;

            max-width: 28rem;

            padding: 3.5rem 3.25rem;

        }

        .glass-hero::before {

            content: '';

            position: absolute;

            top: -60%;

            left: -30%;

            width: 70%;

            height: 220%;

            background: linear-gradient(108deg, transparent 42%, rgba(255, 255, 255, 0.1) 50%, transparent 58%);

            transform: rotate(-10deg);

            pointer-events: none;

            animation: glassShine 9s ease-in-out infinite;

        }

        .glass-hero::after {

            content: '';

            position: absolute;

            bottom: 0;

            left: 12%;

            right: 12%;

            height: 1px;

            background: linear-gradient(90deg, transparent, color-mix(in srgb, ${primaryColor} 75%, white), transparent);

            box-shadow: 0 0 22px 5px color-mix(in srgb, ${primaryColor} 22%, transparent);

            pointer-events: none;

        }

        .glass-hero__glow-bar {

            width: 3.5rem;

            height: 3px;

            margin: 0 auto 1.5rem;

            border-radius: 999px;

            background: linear-gradient(90deg, transparent, ${primaryColor}, transparent);

            box-shadow: 0 0 18px color-mix(in srgb, ${primaryColor} 55%, transparent);

            animation: glowPulse 3.5s ease-in-out infinite;

        }

        @keyframes glassShine {

            0%, 100% { opacity: 0.35; transform: rotate(-10deg) translateX(0); }

            50% { opacity: 0.85; transform: rotate(-10deg) translateX(18%); }

        }

        @keyframes glowPulse {

            0%, 100% { opacity: 0.55; transform: scaleX(1); }

            50% { opacity: 1; transform: scaleX(1.18); }

        }

        .glass-hero-title {

            font-family: 'Heebo', sans-serif;

            font-weight: 300;

            letter-spacing: 0.04em;

            line-height: 1.2;

            max-width: 100%;

        }

        .glass-hero-title__line {

            display: block;

        }

        .glass-hero__text {

            max-width: 100%;
            white-space: pre-line;

        }

        @media (max-width: 1023px) {

            .glass-hero-wrapper {

                top: auto;

                bottom: 1.25rem;

                left: 50%;

                right: auto;

                transform: translateX(-50%);

                width: calc(100% - 2.5rem);

                max-width: 26rem;

            }

            .glass-hero {

                width: 100%;

                max-width: none;

                padding: 1.75rem 1.5rem;

            }

            .glass-hero-wrapper::before {

                inset: -18% -12%;

                filter: blur(20px);

            }

        }

        @media (max-width: 767px) {

            .glass-hero {

                padding: 1.125rem 1rem;

            }

            .glass-hero__glow-bar {

                width: 2.5rem;

                margin-bottom: 0.625rem;

            }

            .glass-hero-title {

                margin-bottom: 0 !important;

                font-size: 1.625rem;

                line-height: 1.08;

            }

            .glass-hero-title__line {

                line-height: 1.08;

            }

            .glass-hero__text {

                margin-top: 0 !important;

                margin-bottom: 0.875rem !important;

                font-size: 0.9375rem;

                line-height: 1.45;

            }

            .glass-hero .flex button {

                padding-top: 0.75rem;

                padding-bottom: 0.75rem;

                padding-left: 2rem;

                padding-right: 2rem;

            }

        }

        @media (min-width: 768px) and (max-width: 1023px) {

            .glass-hero-wrapper {

                bottom: 1.75rem;

                max-width: 34rem;

            }

            .glass-hero {

                padding: 2rem 2.25rem;

            }

        }

        @media (max-width: 1023px) {

            #contact.elegant-contact-section--has-bg {

                padding-top: 0;

                background-color: #1c1b1b;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-form-area.contact-section-has-bg {

                position: relative;

                overflow: hidden;

                padding-top: 8rem;

                padding-bottom: 1.25rem;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-form-area .contact-section-bg-mobile {

                opacity: 0.4;

                filter: brightness(1.45) saturate(0.68) contrast(0.9);

                -webkit-mask-image: none;

                mask-image: none;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-form-area .contact-section-bg-overlay {

                background: linear-gradient(to bottom, color-mix(in srgb, #1c1b1b 58%, transparent) 0%, #1c1b1b 100%);

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-details-area {

                background-color: #1c1b1b;

                margin-top: 0;

                padding-top: 0;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-details-area .elegant-contact-details {

                margin-top: 0;

            }

        }

        @media (min-width: 1024px) {

            #contact.elegant-contact-section--has-bg {

                position: relative;

                overflow: hidden;

                padding-top: 8rem;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-form-area.contact-section-has-bg {

                position: static;

                overflow: visible;

                padding-bottom: 0;

            }

            #contact.elegant-contact-section--has-bg .elegant-contact-details-area {

                position: relative;

                z-index: 1;

            }

        }

        @keyframes gentleFloat {

            0%, 100% { transform: translateY(0) rotate(0deg); }

            25% { transform: translateY(-3px) rotate(0.5deg); }

            50% { transform: translateY(0) rotate(0deg); }

            75% { transform: translateY(3px) rotate(-0.5deg); }

        }

        .gallery-img {

            width: 100%;

            height: 100%;

            object-fit: cover;

        }



        .hairline-border {

            border: 1px solid rgba(15, 15, 13, 0.1);

        }



        .reveal-on-scroll {

            opacity: 0;

            transform: translateY(30px);

            transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);

        }

        .reveal-on-scroll.active {

            opacity: 1;

            transform: translateY(0);

        }



        .image-reveal {

            overflow: hidden;

            position: relative;

        }

        .image-reveal img {

            transition: transform 1.8s cubic-bezier(0.2, 0, 0.2, 1);

            transform: scale(1.15);

        }

        .image-reveal.active img {

            transform: scale(1);

        }



        .material-symbols-outlined {

            font-variation-settings: 'wght' 200, 'opsz' 24;

        }



        @media (max-width: 1024px) {

            .tablet-stack {

                grid-template-columns: 1fr !important;

            }

        }

        ${UNIFIED_GALLERY_GRID_CSS}

        ${HOMEPAGE_PACKAGES_GRID_CSS}

        ${POSTS_PACKAGES_TRANSITION_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${elegantFaqSectionCss(primaryColor)}

        ${HERO_SLIDESHOW_CSS}

        ${sectionBgCss}

        ${HOMEPAGE_LTR_CSS}

        ${generateSiteNavMobileStyles()}

    </style>

</head>

<body class="theme-elegant selection:bg-[${primaryColor}] selection:text-white">

${generateSiteNav(siteChrome('elegant'))}

<main>

<section class="relative h-screen overflow-hidden reveal-on-scroll">

<div class="absolute inset-0 z-0 image-reveal active">

${heroSlideshowHtml}

</div>

<div class="glass-hero-wrapper">

<div class="glass-hero text-center">

<div class="glass-hero__glow-bar" aria-hidden="true"></div>

<h1 class="glass-hero-title text-3xl md:text-5xl mb-0 md:mb-6 text-on-surface">${glassHeroTitle(studioName)}</h1>

<p class="glass-hero__text font-body text-lg md:text-xl text-on-surface/70 mb-6 md:mb-10 mx-auto font-light leading-relaxed md:leading-relaxed">${aboutTextHtml}</p>

<div class="flex justify-center">

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="bg-[#0F0F0D] text-white px-12 py-4 text-xs uppercase tracking-[0.3em] hover:bg-accent transition-all duration-300">

                    ${homepageCopy.hero.viewGalleries}

                </button>

</div>

</div>

</div>

</section>

${hasStats ? `

<section class="px-margin-mobile md:px-margin-desktop py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl reveal-on-scroll">

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsYears)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">${homepageCopy.stats.yearsExperience}</span>

</div>

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsClients)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">${homepageCopy.stats.happyClients}</span>

</div>

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsProjects)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">${homepageCopy.stats.portfolios}</span>

</div>

</section>

` : ''}

${aboutTitle || aboutSubtitle || aboutDescription ? `

<section class="px-margin-mobile md:px-margin-desktop py-32 max-w-7xl mx-auto reveal-on-scroll relative" id="about">

<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70"></div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">

<div class="order-2 lg:order-1 max-w-2xl">

<span class="elegant-accent font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">${homepageCopy.about.label}</span>

${aboutTitle ? elegantSectionHeading(aboutTitle, 'ABOUT', { titleClass: 'mb-4' }) : ''}

${aboutSubtitle ? `<p class="font-body text-lg mb-6 leading-relaxed opacity-80" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="font-body text-base mb-10 opacity-60 leading-relaxed" style="white-space: pre-line">${aboutDescription}</p>` : ''}

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="border border-[#0F0F0D] px-10 py-3 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all duration-300">

                    ${homepageCopy.hero.viewGalleries}

                </button>

</div>

<div class="order-1 lg:order-2 image-reveal aspect-[4/5] shadow-2xl">

${aboutImageHtml}

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section py-24 bg-white" id="gallery">

<div class="homepage-gallery-header px-margin-mobile md:px-margin-desktop mb-8">

<div class="flex flex-row-reverse justify-between items-end homepage-gallery-reveal">

${elegantSectionHeading(homepageCopy.sections.collections, 'COLLECTIONS')}

</div>

</div>

<div class="homepage-gallery-grid homepage-gallery-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'elegant', siteLanguage)}

</div>

</section>

` : ''}

${galleries.some((g) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header">

<div class="flex flex-row-reverse justify-between items-end">

${elegantSectionHeading(homepageCopy.sections.recentPhotos, 'LATEST')}

${portfolioCtaHtml}

</div>

</div>

<div class="recent-photos-grid recent-photos-grid--elegant">

${generateRecentPhotosGridHTML(galleries, 'elegant')}

</div>

</section>

` : ''}

${postsSectionHtml}

${hasPackages ? `

<section class="py-16 md:py-32 px-margin-mobile md:px-margin-desktop relative" id="pricing">

${aboutAmbientBackgroundHtml}

<div class="mx-auto max-w-7xl relative z-10">

<div class="text-center mb-8 stagger-reveal" data-reveal-delay="0">

${elegantSectionHeading(packagesSectionCopy.title, 'PACKAGES', { center: true })}

<p class="font-body opacity-60 italic">${escapeHtml(packagesSectionCopy.subtitle)}</p>

</div>

<div class="${packagesGridClass}">${generatePackagesHTML('elegant')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section pt-16 pb-8 md:pt-32 md:pb-12" id="testimonials">

<div class="testimonials-section__header reveal-on-scroll">

${elegantSectionHeading(testimonialsSectionTitle, 'RECOMMEND')}

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('elegant')}</div>

</section>

` : ''}

${generateFaqSectionHTML('elegant')}

<section id="contact" class="elegant-contact-section ${hasContactBg ? 'elegant-contact-section--has-bg pb-12' : 'pt-32 pb-12 bg-[#1c1b1b] px-margin-mobile md:px-margin-desktop'} text-white reveal-on-scroll">

<div class="elegant-contact-form-area ${hasContactBg ? 'contact-section-has-bg' : 'px-margin-mobile md:px-margin-desktop'}">

${hasContactBg ? contactBgLayers('#1c1b1b', '#1c1b1b') : ''}

<div class="max-w-4xl mx-auto contact-section-content px-margin-mobile md:px-margin-desktop">

<div class="text-center mb-8">

${elegantSectionHeading(contactSectionCopy.title, 'CONTACT', { center: true, onDark: true })}

<p class="opacity-60 font-light">${escapeHtml(contactSectionCopy.subtitle)}</p>

</div>

${email ? `

<form class="grid grid-cols-1 md:grid-cols-2 gap-10">

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.fullName}</label>

<input name="name" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.name}" type="text"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.email}</label>

<input name="email" required ${contactLtrDir} class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.email}" type="email"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.phone}</label>

<input name="phone" ${contactLtrDir} class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.phone}" type="tel"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.subject}</label>

<input name="subject" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.subject}" type="text"/>

</div>

<div class="md:col-span-2 space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">${homepageCopy.contactForm.message}</label>

<textarea name="message" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white min-h-[120px] resize-none ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.messageHelp}"></textarea>

</div>

${generateContactPrivacyConsentHTML('elegant', primaryColor, homepageCopy, 'md:col-span-2')}

<div class="md:col-span-2 flex justify-center mt-6">

<button type="submit" class="elegant-bg-accent text-white px-16 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300">

                        ${homepageCopy.contactForm.submit}

                    </button>

</div>

</form>

` : `<div class="text-center py-20 opacity-40"><p class="font-body text-lg">${homepageCopy.contactForm.noEmail}</p></div>`}

</div>

</div>

<div class="max-w-4xl mx-auto contact-section-content px-margin-mobile md:px-margin-desktop${hasContactBg ? ' elegant-contact-details-area' : ''}">

${generateElegantContactDetailsHTML()}

</div>

</section>

</main>

${generateSiteFooter(siteChrome('elegant'))}

<script>

    const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };

    const revealObserver = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add('active');

                const imgReveal = entry.target.querySelector('.image-reveal');

                if (imgReveal) imgReveal.classList.add('active');

            }

        });

    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));

    ${generateSiteNavScrollScript('elegant')}

    ${generateLogoColoringScript()}

    

    // Smooth scroll for navigation links

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener('click', function (e) {

            e.preventDefault();

            const targetId = this.getAttribute('href');

            if (targetId === '#') {

                window.scrollTo({ top: 0, behavior: 'smooth' });

                return;

            }

            const targetElement = document.querySelector(targetId);

            if (targetElement) {

                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            }

        });

    });

</script>

<script>${HERO_SLIDESHOW_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>

<script>${TESTIMONIALS_MARQUEE_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_CAROUSEL_INIT_SCRIPT}</script>

<script>${HOMEPAGE_GALLERY_REVEAL_SCRIPT}</script>

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId, homepageCopy)}</script>

</body>

</html>

  `;



  // MODERN THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA

  const ModernTheme = () => `

<!DOCTYPE html>

<html class="light" ${htmlAttrs} style="scroll-behavior: smooth;">

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700;800&family=Space+Grotesk:wght@300..700&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<style>

        :root {

            --headline-font: 'Space Grotesk', 'Heebo', sans-serif;

            --about-title-font: 'Rubik', 'Heebo', sans-serif;

        }

        body {

            font-family: 'Heebo', sans-serif;

            background-color: #F8FAFC;

            color: #0F172A;

            scroll-behavior: smooth;

        }

        .font-headline {

            font-family: var(--headline-font);

        }

        .material-symbols-outlined {

            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;

        }

        .modern-shadow {

            box-shadow: 0px 4px 20px rgba(15, 23, 42, 0.05);

        }

        .modern-section-subtitle {

            color: ${primaryColor};

        }

        

        @keyframes revealUp {

            from { opacity: 0; transform: translateY(24px); }

            to { opacity: 1; transform: translateY(0); }

        }

        .animate-reveal {

            animation: revealUp 0.6s cubic-bezier(0.2, 0, 0.2, 1) forwards;

            opacity: 0;

        }

        .delay-100 { animation-delay: 100ms; }

        .delay-200 { animation-delay: 200ms; }

        .delay-300 { animation-delay: 300ms; }



        .hover-scale {

            transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

        }

        .hover-scale:hover {

            transform: scale(1.02);

        }

        .modern-stats-section {

            width: 100%;

            max-width: 100%;

            padding-top: 30px;

            padding-bottom: 80px;

        }

        .modern-stats-grid {

            display: grid;

            grid-template-columns: 1fr;

            width: 100%;

            gap: 4px;

            padding-inline: 4px;

            box-sizing: border-box;

        }

        @media (min-width: 768px) {

            .modern-stats-grid {

                grid-template-columns: repeat(3, minmax(0, 1fr));

            }

        }

        .modern-stats-card {

            min-width: 0;

            width: 100%;

        }

        

        .btn-magnetic {

            transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.2s ease;

            display: inline-flex;

            align-items: center;

            justify-content: center;

        }

        .btn-magnetic:active {

            transform: scale(0.96);

        }



        .nav-glass {

            background: rgba(248, 250, 252, 0.8);

            backdrop-filter: blur(12px);

            -webkit-backdrop-filter: blur(12px);

        }

        .modern-nav .modern-nav-brand,

        .modern-nav .modern-nav-link,

        .modern-nav .modern-nav-menu-btn {

            color: #ffffff;

            transition: color 0.7s ease;

        }

        .modern-nav:not(.nav-scrolled) {

            background: transparent !important;

            backdrop-filter: none !important;

            -webkit-backdrop-filter: none !important;

            box-shadow: none !important;

        }

        .modern-nav .modern-nav-link:hover,

        .modern-nav .modern-nav-menu-btn:hover {

            color: rgba(255, 255, 255, 0.75);

        }

        .modern-nav .modern-nav-logo {

            transition: filter 0.7s ease;

        }

        .modern-nav:not(.nav-scrolled) .modern-nav-logo {

            filter: brightness(0) invert(1);

        }

        .modern-nav.nav-scrolled .modern-nav-brand {

            color: #0F172A;

        }

        .modern-nav.nav-scrolled .modern-nav-link {

            color: ${primaryColor};

        }

        .modern-nav.nav-scrolled .modern-nav-link:hover,

        .modern-nav.nav-scrolled .modern-nav-menu-btn:hover {

            opacity: 0.85;

        }

        .modern-nav.nav-scrolled .modern-nav-menu-btn {

            color: #0F172A;

        }

        .modern-nav.nav-scrolled .modern-nav-logo {

            filter: ${photographer.should_color_logo ? 'none' : 'brightness(0) invert(1)'};

        }

        .modern-about-content {

            color: #ffffff;

            text-align: right;

            position: relative;

        }

        .modern-about-content h1,

        .modern-about-content p,

        .modern-about-content .modern-about-actions {

            width: 100%;

            max-width: 36rem;

            display: flex;

            flex-wrap: wrap;

            justify-content: flex-start;

            gap: 1rem;

        }

        .modern-about-content .modern-about-muted {

            color: rgba(255, 255, 255, 0.82);

        }

        .theme-modern .modern-about-content h1 {

            font-family: var(--about-title-font);

            font-weight: 700;

            letter-spacing: 0.02em;

            color: transparent !important;

            -webkit-text-fill-color: transparent;

            -webkit-text-stroke: 1.5px ${primaryColor};

            paint-order: stroke fill;

            text-shadow: ${aboutHollowTitleAmbientShadow};

        }

        .theme-modern .modern-about-content h1 .text-primary {

            color: transparent !important;

            -webkit-text-fill-color: transparent;

        }

        .modern-homepage-gallery-section {

            padding-top: clamp(3.5rem, 9vw, 6rem) !important;

            padding-bottom: clamp(2.5rem, 6vw, 4rem) !important;

        }

        .modern-recent-photos-section.recent-photos-section {

            padding-top: calc(clamp(3.5rem, 8vw, 5.5rem) + 50px) !important;

            padding-bottom: clamp(2.5rem, 6vw, 4rem) !important;

        }

        #pricing.contact-section-has-bg .contact-section-bg-desktop {

            opacity: 0.68;

            filter: brightness(1.18) saturate(0.92) contrast(0.96);

            -webkit-mask-image: none;

            mask-image: none;

        }

        #pricing.contact-section-has-bg .contact-section-bg-mobile {

            opacity: 0.52;

            filter: brightness(1.28) saturate(0.88) contrast(0.94);

            -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 58%, rgba(0,0,0,0.12) 100%);

            mask-image: linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 58%, rgba(0,0,0,0.12) 100%);

        }

        #pricing.contact-section-has-bg .contact-section-bg-overlay {

            background: linear-gradient(

                to bottom,

                color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #F8FAFC)) 18%, transparent) 0%,

                color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #F8FAFC)) 42%, transparent) 100%

            ) !important;

        }

        #contact.contact-section-has-bg {

            padding-inline: 0.75rem;

        }

        #contact.contact-section-has-bg .contact-section-bg-overlay {

            background: transparent !important;

        }

        #contact.contact-section-has-bg .contact-section-bg-desktop,

        #contact.contact-section-has-bg .contact-section-bg-mobile {

            opacity: 0.74;

            filter: none;

            -webkit-mask-image: none;

            mask-image: none;

            border-radius: 0;

            left: 0.75rem;

            width: calc(100% - 1.5rem);

            margin-left: 0;

        }

        #contact.contact-section-has-bg .contact-section-content {

            position: relative;

            z-index: 1;

        }

        #contact.contact-section-has-bg .modern-contact-card--has-bg {

            background-color: transparent !important;

            border-radius: 0 !important;

            box-shadow: none;

        }

        #contact.contact-section-has-bg .modern-contact-card h2,

        #contact.contact-section-has-bg .modern-contact-card p,

        #contact.contact-section-has-bg .modern-contact-card .text-white,

        #contact.contact-section-has-bg .modern-contact-info-row {

            text-shadow: 0 1px 10px rgba(15, 23, 42, 0.55);

        }

        @media (min-width: 768px) {

            #contact.contact-section-has-bg {

                padding-inline: 1.5rem;

            }

            #contact.contact-section-has-bg .contact-section-bg-desktop,

            #contact.contact-section-has-bg .contact-section-bg-mobile {

                left: 1.5rem;

                width: calc(100% - 3rem);

            }

            #contact.contact-section-has-bg .contact-section-content {

                max-width: none;

                width: 100%;

                padding-inline: 1.5rem;

            }

            #contact.contact-section-has-bg .modern-contact-card--has-bg {

                padding: 2.5rem 1.5rem;

            }

        }

        @media (max-width: 767px) {

            #pricing.contact-section-has-bg .contact-section-bg-overlay {

                background: linear-gradient(

                    to bottom,

                    transparent 0%,

                    color-mix(in srgb, var(--contact-fade, #F8FAFC) 28%, transparent) 58%,

                    color-mix(in srgb, var(--contact-fade, #F8FAFC) 72%, transparent) 100%

                ) !important;

            }

            #contact.contact-section-has-bg .contact-section-content {

                max-width: none;

                width: 100%;

                padding-inline: 0.75rem;

            }

            #contact.contact-section-has-bg .modern-contact-card--has-bg {

                padding: 1.5rem 0.75rem;

            }

            #contact .modern-contact-card {

                text-align: center;

            }

            #contact .modern-contact-card .modern-contact-info {

                max-width: none;

                width: 100%;

                text-align: center;

            }

            #contact .modern-contact-card .modern-contact-info-row {

                justify-content: center;

            }

            #contact .modern-contact-form {

                width: 100%;

                padding-inline: 0.75rem;

                box-sizing: border-box;

            }

            #contact .modern-contact-form .modern-contact-form-grid {

                grid-template-columns: 1fr !important;

                width: 100%;

            }

            #contact .modern-contact-form input,

            #contact .modern-contact-form textarea,

            #contact .modern-contact-form button {

                width: 100%;

            }

        }

        .modern-contact-card {

            backdrop-filter: none;

            -webkit-backdrop-filter: none;

        }

        .modern-contact-card:not(.modern-contact-card--has-bg) {

            background-color: ${primaryColor};

        }

        .modern-contact-card--has-bg {

            background-color: transparent;

        }

        ${UNIFIED_GALLERY_GRID_CSS}

        ${HOMEPAGE_PACKAGES_GRID_CSS}

        ${POSTS_PACKAGES_TRANSITION_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${MODERN_FAQ_ACCORDION_CSS}

        ${FAQ_SECTION_GLOW_CSS}

        ${MODERN_HERO_FILM_BELT_CSS}

        ${sectionBgCss}

        ${HOMEPAGE_LTR_CSS}

        ${generateSiteNavMobileStyles()}

    </style>

<script id="tailwind-config">

        tailwind.config = {

            darkMode: "class",

            theme: {

                extend: {

                    colors: {

                        primary: "${primaryColor}",

                        background: "#F8FAFC",

                        "on-surface": "#0F172A",

                        "on-surface-variant": "#475569",

                        outline: "#94a3b8",

                        "outline-variant": "#cbd5e1",

                        surface: "#ffffff",

                        "surface-dim": "#f1f5f9",

                        "surface-container": "#f1f5f9",

                        "surface-variant": "#e2e8f0",

                    },

                    borderRadius: {

                        "DEFAULT": "12px",

                        "lg": "12px",

                        "xl": "16px",

                        "2xl": "24px",

                        "full": "9999px"

                    },

                    spacing: {

                        "xl": "48px",

                        "md": "16px",

                        "xxl": "80px",

                        "lg": "24px"

                    }

                },

            },

        }

    </script>

</head>

<body class="theme-modern bg-background text-on-surface overflow-x-hidden">

${generateSiteNav(siteChrome('modern'))}

<main${aboutTitle || aboutSubtitle || aboutDescription ? '' : ' class="pt-xxl"'}>

${aboutTitle || aboutSubtitle || aboutDescription ? `

<section class="relative min-h-screen w-full overflow-hidden" id="about">

<div class="absolute inset-0 z-0">

${heroSlideshowModernHtml}

</div>

<div class="relative z-10 min-h-screen flex items-center pt-[80px]">

<div class="w-full max-w-7xl mx-auto px-lg py-xxl grid grid-cols-1 md:grid-cols-2 gap-xl items-center min-h-[calc(100vh-80px)]">

<div class="flex flex-col gap-md animate-reveal relative z-10 modern-about-content justify-self-start max-w-2xl">

<span class="text-primary font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">${homepageCopy.about.label}</span>

${aboutTitle ? '<h1 class="about-hollow-title font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">' + aboutTitle + '</h1>' : '<h1 class="about-hollow-title font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">' + homepageCopy.about.modernDefaultTitleLine1 + ' <br/><span class="text-primary">' + homepageCopy.about.modernDefaultTitleLine2 + '</span></h1>'}

${aboutSubtitle ? '<p class="text-lg md:text-xl modern-about-muted leading-relaxed" style="white-space: pre-line">' + aboutSubtitle + '</p>' : ''}

${aboutDescription ? '<p class="text-lg md:text-xl modern-about-muted leading-relaxed" style="white-space: pre-line">' + aboutDescription + '</p>' : ''}

<div class="modern-about-actions pt-md">

<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="bg-primary text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:shadow-xl shadow-indigo-200 transition-all">

                    ${homepageCopy.hero.getStarted}

                </button>

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="border border-white/40 text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:bg-white/10 transition-all">

                    ${homepageCopy.hero.viewGallery}

                </button>

</div>

</div>

<div class="hidden md:block" aria-hidden="true"></div>

</div>

</div>

</section>

` : ''}

${hasStats ? `

<section class="modern-stats-section w-full">

<div class="modern-stats-grid">

<div class="modern-stats-card bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">photo_camera</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsProjects)}</h3>

<p class="text-on-surface-variant font-medium">${homepageCopy.stats.portfolios}</p>

</div>

<div class="modern-stats-card bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-100 hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">groups</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsClients)}</h3>

<p class="text-on-surface-variant font-medium">${homepageCopy.stats.happyClients}</p>

</div>

<div class="modern-stats-card bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-200 hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">military_tech</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsYears)}</h3>

<p class="text-on-surface-variant font-medium">${homepageCopy.stats.yearsExperience}</p>

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section modern-homepage-gallery-section" id="portfolio">

<div class="homepage-gallery-header px-lg mb-xl homepage-gallery-reveal">

<div class="flex flex-row-reverse justify-between items-end gap-md">

<div class="text-start rtl:text-right">

<h2 class="font-headline text-4xl font-bold mb-xs">${homepageCopy.sections.modernGalleryTitle}</h2>

<p class="modern-section-subtitle">${homepageCopy.sections.modernGallerySubtitle}</p>

</div>

</div>

</div>

<div class="homepage-gallery-grid homepage-gallery-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'modern', siteLanguage)}

</div>

</section>

` : ''}

${galleries.some((g) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section modern-recent-photos-section" id="recent-photos">

<div class="recent-photos-header">

<div class="flex flex-row-reverse justify-between items-end gap-md">

<div class="text-start rtl:text-right">

<h2 class="font-headline text-4xl font-bold mb-xs">${homepageCopy.sections.recentPhotos}</h2>

<p class="modern-section-subtitle">${homepageCopy.sections.modernRecentPhotosSubtitle}</p>

</div>

${portfolioCtaHtml}

</div>

</div>

<div class="recent-photos-grid recent-photos-grid--modern">

${generateRecentPhotosGridHTML(galleries, 'modern')}

</div>

</section>

` : ''}

${postsSectionHtml}

${hasPackages ? `

<section class="py-xxl w-full relative overflow-hidden" id="pricing">

${elegantPackagesGlowHtml}

<div class="max-w-7xl mx-auto px-lg relative z-10">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

<h2 class="font-headline text-4xl font-bold text-on-surface">${escapeHtml(packagesSectionCopy.title)}</h2>

<p class="modern-section-subtitle">${escapeHtml(packagesSectionCopy.subtitle)}</p>

</div>

<div class="${packagesGridClass}">${generatePackagesHTML('modern')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section testimonials-section--modern py-xxl reveal" id="testimonials">

<div class="testimonials-section__inner contact-section-content relative z-10">

<div class="testimonials-section__header stagger-reveal" data-reveal-delay="0">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">${escapeHtml(testimonialsSectionSubtitle)}</span>

<h2 class="font-headline-md text-headline-md text-on-surface">${escapeHtml(testimonialsSectionTitle)}</h2>

<div class="testimonials-section__divider w-12 h-px bg-outline-variant mt-md"></div>

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('modern')}</div>

</div>

</section>

` : ''}

${generateFaqSectionHTML('modern')}

<section class="w-full ${hasContactBg ? 'contact-section-has-bg py-xxl' : 'max-w-7xl mx-auto px-lg'}" id="contact">

${contactBgLayers('#F8FAFC')}

<div class="contact-section-content">

<div class="modern-contact-card ${hasContactBg ? 'modern-contact-card--has-bg' : 'bg-primary rounded-2xl'} p-xl md:p-xxl text-white animate-reveal">

<div class="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">

<div class="modern-contact-info max-w-md text-start rtl:text-right">

<h2 class="font-headline text-4xl font-bold mb-sm text-white">${escapeHtml(contactSectionCopy.title)}</h2>

<p class="text-lg opacity-90 text-white mb-lg">${escapeHtml(contactSectionCopy.subtitle)}</p>

<div class="flex flex-col gap-md">

${studioPhone ? `
<div class="modern-contact-info-row flex items-center justify-start gap-sm">

<span class="material-symbols-outlined text-white">call</span>

<span class="text-white" dir="ltr">${studioPhoneHtml}</span>

</div>` : ''}

<div class="modern-contact-info-row flex items-center justify-start gap-sm">

<span class="material-symbols-outlined text-white">mail</span>

<span class="text-white">${email || 'hello@studiogallery.co.il'}</span>

</div>

${studioAddress ? `

<div class="modern-contact-info-row flex items-center justify-start gap-sm">

<span class="material-symbols-outlined text-white">location_on</span>

<span class="text-white">${studioAddressHtml}</span>

</div>` : ''}

</div>

</div>

<form class="modern-contact-form flex flex-col gap-md w-full">

<div class="modern-contact-form-grid grid grid-cols-1 sm:grid-cols-2 gap-md">

<div class="relative">

<input name="name" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${contactAlign}" id="contact_name" placeholder="${homepageCopy.contactForm.fullName}" type="text"/>

</div>

<div class="relative">

<input name="email" required ${contactLtrDir} class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${contactLtrAlign}" id="contact_email" placeholder="${homepageCopy.contactForm.placeholders.email}" type="email"/>

</div>

</div>

<div class="relative">

<input name="phone" ${contactLtrDir} class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${contactLtrAlign}" id="contact_phone" placeholder="${homepageCopy.contactForm.placeholders.phone}" type="tel"/>

</div>

<div class="relative">

<textarea name="message" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${contactAlign}" id="contact_message" placeholder="${homepageCopy.contactForm.placeholders.message}" rows="3"></textarea>

</div>

${generateContactPrivacyConsentHTML('modern', primaryColor, homepageCopy)}

<button class="bg-white text-primary px-xl py-md rounded-lg font-bold btn-magnetic hover:shadow-xl w-full transition-all" type="submit">

                        ${homepageCopy.contactForm.submit}

                    </button>

</form>

</div>

</div>

</div>

</section>

</main>

${generateSiteFooter(siteChrome('modern'))}

<script>${generateSiteNavScrollScript('modern')}</script>

<script>${generateLogoColoringScript()}</script>

<script>${MODERN_HERO_FILM_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>

<script>${TESTIMONIALS_MARQUEE_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_CAROUSEL_INIT_SCRIPT}</script>

<script>${HOMEPAGE_GALLERY_REVEAL_SCRIPT}</script>

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId, homepageCopy)}</script>

</body>

</html>

  `;



  // CLASSIC THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA

  const ClassicTheme = () => `

<!DOCTYPE html>

<html ${htmlAttrs}>

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@400;700&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<style>

        :root {

            --headline-font: 'Frank Ruhl Libre', serif;

        }

        body {

            font-family: 'Heebo', sans-serif;

            scroll-behavior: smooth;

        }

        .material-symbols-outlined {

            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;

        }

        .classic-overlay {

            background: linear-gradient(to top, rgba(181, 129, 106, 0.6) 0%, rgba(181, 129, 106, 0) 100%);

        }

        .reveal {

            opacity: 0;

            transform: translateY(30px);

            transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);

        }

        .reveal.active {

            opacity: 1;

            transform: translateY(0);

        }

        .stagger-item {

            opacity: 0;

            transform: translateY(20px);

            transition: opacity 0.8s ease-out, transform 0.8s ease-out;

        }

        .reveal.active .stagger-item {

            opacity: 1;

            transform: translateY(0);

        }

        .stagger-item:nth-child(1) { transition-delay: 0.1s; }

        .stagger-item:nth-child(2) { transition-delay: 0.2s; }

        .stagger-item:nth-child(3) { transition-delay: 0.3s; }

        @keyframes float {

            0%, 100% { transform: translateY(0px); }

            50% { transform: translateY(-6px); }

        }

        @keyframes verticalLabelFloat {

            0%, 100% {

                transform: rotate(180deg) translateY(0);

                opacity: 0.78;

            }

            50% {

                transform: rotate(180deg) translateY(-16px);

                opacity: 0.95;

            }

        }

        .glass-card-float {

            animation: float 5s ease-in-out infinite;

        }

        .vertical-text-label {

            writing-mode: vertical-rl;

            transform: rotate(180deg);

            font-size: 1.2rem;

            font-weight: 500;

            letter-spacing: 0.38em;

            color: rgba(255, 255, 255, 0.78);

            text-shadow:

                0 2px 18px rgba(0, 0, 0, 0.42),

                0 0 28px rgba(255, 255, 255, 0.14),

                0 1px 2px rgba(0, 0, 0, 0.25);

            animation: verticalLabelFloat 5.5s ease-in-out infinite;

        }

        .glass-card-frame {

            position: relative;

            display: block;

            width: 100%;

            max-width: 450px;

            flex-shrink: 0;

            box-sizing: border-box;

        }

        .glass-card-accent-line {

            position: absolute;

            bottom: -18px;

            right: 40px;

            width: 56px;

            height: 2px;

            background: ${primaryColor};

            pointer-events: none;

        }

        .glass-card {

            background: rgba(255, 255, 255, 0.1);

            backdrop-filter: blur(4px);

            -webkit-backdrop-filter: blur(4px);

            border: 1px solid rgba(255, 255, 255, 0.75);

            border-radius: 0;

            box-shadow: none;

        }

        .hero-glass-container {

            position: absolute;

            z-index: 10;

            bottom: 0;

            left: 0;

            right: 0;

            transform: none;

            width: 100%;

            padding: 0 1rem 1rem;

            box-sizing: border-box;

        }

        @media (max-width: 767px) {

            .hero-glass-card {

                padding-top: 1rem !important;

                padding-bottom: 1rem !important;

                padding-left: 0.75rem !important;

                padding-right: 0.75rem !important;

            }

            .hero-glass-inner {

                gap: 0.625rem;

            }

            .hero-glass-copy .font-label-sm {

                margin-bottom: 0.5rem !important;

            }

            .hero-glass-copy h1 {

                margin-bottom: 0.5rem !important;

                line-height: 1.2;

            }

            .hero-glass-actions {

                gap: 0.5rem;

            }

            .hero-glass-actions button {

                padding-top: 0.625rem;

                padding-bottom: 0.625rem;

            }

        }

        @media (min-width: 768px) and (max-width: 1023px) {

            .hero-glass-container {

                padding: 0 1.25rem 1.25rem;

            }

            .hero-glass-inner {

                flex-direction: column;

                align-items: center;

                justify-content: center;

                gap: 1.25rem;

            }

            .hero-glass-copy {

                text-align: center;

                flex: none;

                width: 100%;

            }

            .hero-glass-copy h1 {

                font-size: clamp(1.75rem, 3.5vw, 2.25rem);

                margin-bottom: 0.75rem;

            }

            .hero-glass-copy p {

                font-size: 1rem;

                margin-bottom: 0;

                max-width: 36rem;

                margin-left: auto;

                margin-right: auto;

                white-space: pre-line;

            }

            .hero-glass-actions {

                flex-direction: row;

                flex-shrink: 0;

                align-self: center;

                justify-content: center;

                width: auto;

                max-width: 100%;

            }

            .hero-glass-card {

                width: 100%;

                padding: 1.75rem 2rem;

            }

        }

        @media (min-width: 1024px) {

            .hero-glass-container {

                position: relative;

                bottom: auto;

                left: auto;

                right: auto;

                transform: none;

                width: auto;

                padding: 0 0 4rem 8rem;

            }

            .hero-glass-inner {

                flex-direction: column;

                align-items: stretch;

            }

            .hero-glass-copy {

                text-align: right;

            }

            .hero-glass-actions {

                flex-direction: row;

            }

            .hero-glass-copy p {

                margin-bottom: 2rem;
                white-space: pre-line;

            }

        }

        .hero-glass-card {

            width: 100%;

            max-width: 450px;

            height: auto;

            box-sizing: border-box;

        }

        @media (min-width: 1024px) {

            .hero-glass-card {

                width: 450px;

                flex: 0 0 450px;

            }

        }

        .hero-glass-inner {

            display: flex;

            flex-direction: column;

            gap: 1.25rem;

        }

        .hero-glass-copy {

            text-align: center;

            height: auto;

            white-space: normal;

            overflow-wrap: break-word;

            word-break: break-word;

        }

        .hero-glass-copy h1,

        .hero-glass-copy p {

            white-space: normal;

            overflow-wrap: break-word;

            word-break: break-word;

        }

        .hero-glass-actions {

            display: flex;

            flex-direction: row;

            flex-wrap: wrap;

            justify-content: center;

            gap: 0.75rem;

            width: 100%;

        }
        @media (min-width: 1024px) {
            .hero-glass-actions {
                flex-direction: column;
            }
        }
        @media (min-width: 640px) and (max-width: 767px) {

            .hero-glass-actions {

                flex-direction: row;

                justify-content: center;

            }

        }

        .classic-nav .classic-nav-brand,

        .classic-nav .classic-nav-link,

        .classic-nav .classic-nav-menu-btn {

            color: #ffffff;

            transition: color 0.7s ease;

        }

        .classic-nav .classic-nav-link:hover,

        .classic-nav .classic-nav-menu-btn:hover {

            color: rgba(255, 255, 255, 0.75);

        }

        .classic-nav .classic-nav-logo {

            transition: filter 0.7s ease;

        }

        .classic-nav:not(.nav-scrolled) .classic-nav-logo {

            filter: brightness(0) invert(1);

        }

        .classic-nav.nav-scrolled .classic-nav-brand {

            color: #2d2825;

        }

        .classic-nav.nav-scrolled .classic-nav-link {

            color: ${primaryColor};

        }

        .classic-nav.nav-scrolled .classic-nav-link:hover {

            color: ${primaryColor};

            opacity: 0.8;

        }

        .classic-nav.nav-scrolled .classic-nav-menu-btn {

            color: #2d2825;

        }

        .classic-nav.nav-scrolled .classic-nav-menu-btn:hover {

            color: ${primaryColor};

        }

        .classic-nav.nav-scrolled .classic-nav-logo {

            filter: ${photographer.should_color_logo ? 'none' : 'brightness(0) invert(1)'};

        }

        .about-section-label {

            font-family: 'Heebo', sans-serif;

            font-size: 11px;

            letter-spacing: 0.32em;

            text-transform: uppercase;

            color: rgba(45, 40, 37, 0.5);

        }

        .about-title {

            font-family: 'Frank Ruhl Libre', serif;

            font-size: clamp(2rem, 3.8vw, 3.1rem);

            line-height: 1.28;

            font-weight: 700;

            color: #2d2825;

        }

        .about-title-underline {

            border-bottom: 2px solid ${primaryColor};

            padding-bottom: 6px;

        }

        .about-body-primary {

            font-family: 'Heebo', sans-serif;

            font-size: 18px;

            line-height: 1.9;

            color: rgba(45, 40, 37, 0.82);

        }

        .about-body-secondary {

            font-family: 'Heebo', sans-serif;

            font-size: 16px;

            line-height: 1.85;

            color: rgba(45, 40, 37, 0.65);

        }

        .about-stat-number {

            font-family: 'Frank Ruhl Libre', serif;

            font-size: clamp(2rem, 3vw, 2.75rem);

            line-height: 1;

            font-weight: 400;

            color: #2d2825;

        }

        .about-stat-label {

            font-family: 'Heebo', sans-serif;

            font-size: 11px;

            letter-spacing: 0.2em;

            text-transform: uppercase;

            color: rgba(45, 40, 37, 0.42);

            margin-top: 10px;

        }

        .about-image-quote {

            background: rgba(255, 255, 255, 0.96);

            padding: 22px 26px;

            box-shadow: 0 16px 40px rgba(45, 40, 37, 0.08);

        }

        .about-image-quote-text {

            font-family: 'Frank Ruhl Libre', serif;

            font-size: 1.05rem;

            line-height: 1.65;

            font-style: italic;

            color: #2d2825;

            text-align: right;

        }

        .about-image-quote-line {

            width: 36px;

            height: 1px;

            background: ${primaryColor};

            margin: 14px 0 10px auto;

        }

        .about-image-quote-name {

            font-family: 'Heebo', sans-serif;

            font-size: 12px;

            letter-spacing: 0.12em;

            color: rgba(45, 40, 37, 0.5);

            text-align: left;

        }

        .about-glow {

            position: absolute;

            pointer-events: none;

            z-index: 0;

            border-radius: 9999px;

        }

        .about-glow-left {

            top: 0;

            left: 0;

            width: 440px;

            height: 440px;

            transform: translate(-58%, -28%);

            filter: blur(58px);

            opacity: 0.72;

        }

        .about-glow-right {

            top: 0;

            right: 0;

            width: 480px;

            height: 480px;

            transform: translate(58%, -28%);

            filter: blur(64px);

            opacity: 0.78;

        }

        ${UNIFIED_GALLERY_GRID_CSS}

        ${HOMEPAGE_PACKAGES_GRID_CSS}

        ${POSTS_PACKAGES_TRANSITION_CSS}

        ${CLASSIC_PACKAGES_ROWS_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${CLASSIC_RECENT_PHOTOS_HEADER_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${CLASSIC_CONTACT_FORM_CSS}

        ${FAQ_ACCORDION_CSS}

        ${classicFaqSectionCss(primaryColor)}

        ${HERO_SLIDESHOW_CSS}

        ${sectionBgCss}

        ${HOMEPAGE_LTR_CSS}

        ${generateSiteNavMobileStyles()}

    </style>

<script id="tailwind-config">

        tailwind.config = {

          darkMode: "class",

          theme: {

            extend: {

              "colors": {

                      "surface-container-lowest": "#ffffff",

                      "on-error": "#ffffff",

                      "on-error-container": "#93000a",

                      "primary-fixed": "#ffdf93",

                      "on-surface-variant": "#5a504a",

                      "on-surface": "#2d2825",

                      "on-tertiary": "#ffffff",

                      "primary-container": "#f1e3da",

                      "on-primary": "#ffffff",

                      "background": "#FAF7F4",

                      "inverse-surface": "#34302e",

                      "surface-container-highest": "#e8e1da",

                      "surface-container-high": "#efe7df",

                      "surface-container": "#f4ede6",

                      "tertiary-fixed-dim": "#e7c365",

                      "inverse-primary": "#eec148",

                      "error": "#ba1a1a",

                      "on-tertiary-fixed-variant": "#594400",

                      "surface-container-low": "#faf3eb",

                      "on-background": "#2d2825",

                      "on-secondary": "#ffffff",

                      "on-secondary-fixed": "#261a00",

                      "surface-tint": "${primaryColor}",

                      "secondary-fixed-dim": "#d9c4a0",

                      "surface-dim": "#e1d9ce",

                      "secondary-fixed": "#f6e0bb",

                      "on-secondary-fixed-variant": "#50452d",

                      "inverse-on-surface": "#f8efe4",

                      "secondary": "#7a6a5e",

                      "surface": "#FAF7F4",

                      "on-primary-container": "#4e3325",

                      "primary": "${primaryColor}",

                      "tertiary-container": "#c9a74d",

                      "surface-variant": "#ede1cf",

                      "outline-variant": "#d1c6b4",

                      "surface-bright": "#FAF7F4",

                      "secondary-container": "#f1e3c8",

                      "tertiary": "#8c4a2d",

                      "tertiary-fixed": "#ffdbcf",

                      "on-primary-fixed-variant": "#594400",

                      "on-tertiary-container": "#351000",

                      "primary-fixed-dim": "#eec148",

                      "on-primary-fixed": "#241a00",

                      "on-secondary-container": "#241a00",

                      "error-container": "#ffdad6",

                      "on-tertiary-fixed": "#351000",

                      "outline": "#8a7d75"

              },

              "borderRadius": {

                      "DEFAULT": "4px",

                      "lg": "4px",

                      "xl": "4px",

                      "full": "9999px"

              },

              "spacing": {

                      "md": "16px",

                      "xl": "48px",

                      "lg": "24px",

                      "sm": "8px",

                      "xs": "4px",

                      "xxl": "80px"

              },

              "fontFamily": {

                      "body-lg": ["Heebo"],

                      "headline-sm": ["var(--headline-font)"],

                      "display-lg": ["var(--headline-font)"],

                      "display-lg-mobile": ["var(--headline-font)"],

                      "label-sm": ["Heebo"],

                      "headline-md": ["var(--headline-font)"],

                      "body-md": ["Heebo"]

              },

              "fontSize": {

                      "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],

                      "headline-sm": ["26px", {"lineHeight": "1.4", "fontWeight": "600"}],

                      "display-lg": ["68px", {"lineHeight": "1.1", "letterSpacing": "-0.01em", "fontWeight": "700"}],

                      "display-lg-mobile": ["42px", {"lineHeight": "1.2", "fontWeight": "700"}],

                      "label-sm": ["13px", {"lineHeight": "1", "letterSpacing": "0.06em", "fontWeight": "500"}],

                      "headline-md": ["36px", {"lineHeight": "1.3", "fontWeight": "600"}],

                      "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}]

              }

            },

          },

        }

    </script>

</head>

<body class="theme-classic bg-surface text-on-surface overflow-x-hidden">

${generateSiteNav(siteChrome('classic'))}

<main>

<section class="relative h-screen w-full flex items-end justify-start overflow-hidden reveal" id="hero">

<div class="absolute inset-0 z-0 scale-105">

${heroSlideshowHtml}

</div>

<div class="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none z-20 hidden lg:block">

<div class="vertical-text-label whitespace-nowrap">

${studioName} · ${photographerName}

</div>

</div>

<div class="hero-glass-container">

<div class="glass-card-frame w-full max-w-[450px] shrink-0">

<div class="glass-card glass-card-float hero-glass-card w-full max-w-[450px] h-auto pt-5 pb-5 px-3 lg:pt-[21px] lg:pb-[27px] lg:px-6 lg:w-[450px] lg:m-5 lg:mt-[calc(1.25rem+10px)] box-border">

<div class="hero-glass-inner">

<div class="hero-glass-copy h-auto whitespace-normal break-words">

<span class="block font-label-sm text-label-sm text-white/80 tracking-[0.3em] mb-2 md:mb-3 lg:mb-6 uppercase whitespace-normal">${studioName}</span>

<h1 class="font-display-lg text-3xl md:text-4xl lg:text-5xl mb-2 md:mb-2 lg:mb-6 leading-tight text-white whitespace-normal break-words">${photographerName} | ${homepageCopy.hero.photographySuffix}</h1>

<p class="font-body-lg text-body-lg text-white/90 mb-0 lg:mb-8 leading-relaxed whitespace-normal break-words">${aboutTextHtml || homepageCopy.about.defaultAboutText}</p>

</div>

<div class="hero-glass-actions">

<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="flex-1 bg-primary text-on-primary px-lg md:px-xl py-2.5 md:py-md rounded-none font-label-sm text-label-sm hover:brightness-110 hover:-translate-y-1 transition-all shadow-lg active:scale-95 whitespace-nowrap">

                        ${homepageCopy.hero.scheduleSession}

                    </button>

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="flex-1 border border-white/30 text-white px-lg md:px-xl py-2.5 md:py-md rounded-none font-label-sm text-label-sm hover:bg-white/10 transition-all whitespace-nowrap">

                        ${homepageCopy.hero.viewGalleries}

                    </button>

</div>

</div>

</div>

<span class="glass-card-accent-line hidden lg:block" aria-hidden="true"></span>

</div>

</div>

</section>

${aboutTitle || aboutSubtitle || aboutDescription ? `

<section class="relative w-full py-xxl reveal overflow-hidden" id="about">

<div class="about-glow about-glow-left" style="background: radial-gradient(circle, ${primaryColor}70 0%, ${primaryColor}45 24%, ${primaryColor}22 46%, transparent 72%);"></div>

<div class="about-glow about-glow-right" style="background: radial-gradient(circle, ${primaryColor}80 0%, ${primaryColor}50 26%, ${primaryColor}28 48%, transparent 74%);"></div>

<div class="max-w-7xl mx-auto px-lg relative z-10">

<div class="grid grid-cols-1 md:grid-cols-2 gap-xl md:gap-xxl items-center">

<div class="order-1 space-y-8 md:pr-8 max-w-2xl">

<span class="about-section-label block">${homepageCopy.about.label}</span>

${aboutTitle ? `<h2 class="about-title">${underlineLastWord(aboutTitle)}</h2>` : `<h2 class="about-title">${underlineLastWord(homepageCopy.about.defaultTitle)}</h2>`}

<div class="space-y-6">

${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}

</div>

${hasStats ? `

<div class="grid grid-cols-3 gap-md md:gap-lg border-t border-outline-variant/15 pt-10 mt-4">

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsClients)}</div>

<div class="about-stat-label">${homepageCopy.stats.happyClients}</div>

</div>

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsProjects)}</div>

<div class="about-stat-label">${homepageCopy.stats.portfolios}</div>

</div>

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsYears)}</div>

<div class="about-stat-label">${homepageCopy.stats.yearsExperience}</div>

</div>

</div>

` : ''}

</div>

<div class="order-2 relative">

${about_image_url ? `<img alt="${homepageCopy.misc.photographerPortraitAlt}" class="w-full aspect-[4/5] md:aspect-[3/4] object-cover" src="${about_image_url}"/>` : ''}

<div class="about-image-quote absolute -bottom-8 -left-6 md:-bottom-10 md:-left-10 max-w-[260px] hidden md:block">

<div class="about-image-quote-line"></div>

<p class="about-image-quote-name">— ${photographerName}</p>

</div>

</div>

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section bg-surface-container-low py-xxl" id="galleries">

<div class="homepage-gallery-header px-lg mb-xl homepage-gallery-reveal">

<div class="text-start rtl:text-right">

<h2 class="font-headline-md text-headline-md text-on-surface">${homepageCopy.sections.classicSelectedWorks}</h2>

<p class="font-body-md text-body-md mt-sm" style="color:${primaryColor};">${homepageCopy.sections.classicSelectedWorksSubtitle}</p>

</div>

</div>

<div class="homepage-gallery-grid homepage-gallery-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'classic', siteLanguage)}

</div>

</section>

` : ''}

${galleries.some((g) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header">

<div class="hp-posts-header hp-posts-header--with-more hp-posts-header--classic stagger-reveal" data-reveal-delay="0">

<div class="hp-posts-header__titles">

<span class="hp-posts-eyebrow" style="color:${primaryColor};">${homepageCopy.sections.classicRecentPhotosEyebrow}</span>

<h2 class="hp-posts-title" style="font-family:'Frank Ruhl Libre', serif;color:#1c1917;">${homepageCopy.sections.recentPhotos}</h2>

<div class="hp-posts-divider" style="background:${primaryColor};"></div>

</div>

${portfolioCtaHtml ? `<div class="hp-posts-header__more">${portfolioCtaHtml}</div>` : ''}

</div>

</div>

<div class="recent-photos-grid recent-photos-grid--classic">

${generateRecentPhotosGridHTML(galleries, 'classic')}

</div>

</section>

` : ''}

${postsSectionHtml}

${hasPackages ? `

<section class="homepage-packages-section py-xxl reveal relative overflow-hidden" id="pricing">

${aboutAmbientBackgroundHtml}

<div class="homepage-packages-section__inner contact-section-content relative z-10">

<div class="homepage-packages-section__header stagger-reveal" data-reveal-delay="0">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">${escapeHtml(packagesSectionCopy.subtitle)}</span>

<h2 class="font-headline-md text-headline-md text-on-surface">${escapeHtml(packagesSectionCopy.title)}</h2>

<div class="homepage-packages-section__divider w-12 h-px bg-outline-variant mt-md"></div>

</div>

<div class="homepage-packages-rows">${generatePackagesHTML('classic')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section py-xxl reveal" id="testimonials">

<div class="testimonials-section__inner contact-section-content relative z-10">

<div class="testimonials-section__header stagger-reveal" data-reveal-delay="0">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">${escapeHtml(testimonialsSectionSubtitle)}</span>

<h2 class="font-headline-md text-headline-md text-on-surface">${escapeHtml(testimonialsSectionTitle)}</h2>

<div class="testimonials-section__divider w-12 h-px bg-outline-variant mt-md"></div>

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('classic')}

</div>

</div>

</section>

` : ''}

${generateFaqSectionHTML('classic')}

<section class="${hasContactBg ? 'contact-section-has-bg pt-xxl pb-xl reveal border-t border-outline-variant/10' : 'bg-surface-container-low pt-xxl pb-xl reveal border-t border-outline-variant/10'}" id="contact">

${contactBgLayers('#fdf8f7', '#f7f3f2')}

<div class="max-w-7xl mx-auto px-lg contact-section-content">

<div class="grid grid-cols-1 lg:grid-cols-12 gap-xl md:gap-xxl items-start classic-contact-layout">

<div class="lg:col-span-5 space-y-lg classic-contact-info text-start rtl:text-right">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block">${homepageCopy.sections.contactClassicHeading}</span>

<h2 class="font-headline-md text-headline-md text-on-surface">${escapeHtml(contactSectionCopy.title)}</h2>

<p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">${escapeHtml(contactSectionCopy.subtitle)}</p>

<div class="classic-contact-details space-y-md pt-lg">

${studioPhone ? `
<a class="classic-contact-details__link flex items-center gap-md flex-row justify-start rtl:justify-start group transition-colors hover:text-primary" href="tel:${studioPhoneHref}">

<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">call</span>

<span class="font-body-md text-body-md shrink-0" dir="ltr">${studioPhoneHtml}</span>

</a>` : ''}

<a class="classic-contact-details__link flex items-center gap-md flex-row justify-start rtl:justify-start group transition-colors hover:text-primary" href="mailto:${email || 'hello@studiogallery.co.il'}">

<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">mail</span>

<span class="font-body-md text-body-md min-w-0 break-all">${email || 'hello@studiogallery.co.il'}</span>

</a>

${studioAddress ? `

<div class="classic-contact-details__item flex items-center gap-md flex-row justify-start rtl:justify-start">

<span class="material-symbols-outlined text-primary shrink-0">location_on</span>

<span class="font-body-md text-body-md">${studioAddressHtml}</span>

</div>` : ''}

</div>

</div>

<div class="lg:col-span-7 min-w-0 classic-contact-form-col">

<form class="classic-contact-form ${hasContactBg ? 'bg-surface/50 backdrop-blur-sm' : 'bg-surface'} p-xl lg:p-xxl rounded-sm shadow-xl border border-outline-variant/20 stagger-item">

<div class="classic-contact-form__row mb-lg">

<div class="classic-contact-field space-y-xs">

<label class="font-label-sm text-label-sm text-on-surface-variant block ${contactAlign}">${homepageCopy.contactForm.fullName}</label>

<input name="name" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-0 ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.nameExample}" required="" type="text"/>

</div>

<div class="classic-contact-field space-y-xs">

<label class="font-label-sm text-label-sm text-on-surface-variant block ${contactAlign}">${homepageCopy.contactForm.phoneContact}</label>

<input name="phone" ${contactLtrDir} class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-0 ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.phone}" type="tel"/>

</div>

</div>

<div class="classic-contact-field space-y-xs mb-lg">

<label class="font-label-sm text-label-sm text-on-surface-variant block ${contactAlign}">${homepageCopy.contactForm.emailAddress}</label>

<input name="email" ${contactLtrDir} class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-0 ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.email}" required="" type="email"/>

</div>

<div class="classic-contact-form__message-block w-full flex flex-col gap-md">

<div class="classic-contact-field space-y-xs">

<label class="font-label-sm text-label-sm text-on-surface-variant block ${contactAlign}">${homepageCopy.contactForm.tellAboutEvent}</label>

<textarea name="message" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 resize-none px-0 ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.messageEvent}" required="" rows="4"></textarea>

</div>

</div>

<div class="contact-privacy-consent w-full flex flex-row items-start gap-sm text-start rtl:text-right">

<input type="checkbox" name="privacy_consent" id="contact_privacy_consent_elegant" required class="contact-privacy-checkbox mt-1 shrink-0 size-4 cursor-pointer rounded border border-current/30" style="accent-color: ${primaryColor};"/>

<p class="text-sm font-light opacity-80 leading-relaxed m-0">

<label for="contact_privacy_consent_elegant" class="cursor-pointer">${homepageCopy.contactForm.privacyBefore}</label> <a href="/privacy" class="underline hover:opacity-80">${homepageCopy.contactForm.privacyLink}</a>.

</p>

</div>

<button class="w-full bg-primary text-on-primary py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-md" type="submit">

                        ${homepageCopy.contactForm.sendInquiry}

<span class="material-symbols-outlined text-sm">send</span>

</button>

</form>

</div>

</div>

</div>

</section>

</main>

${generateSiteFooter(siteChrome('classic'))}

<script>

        ${generateSiteNavScrollScript('classic')}

        ${generateLogoColoringScript()}

        

        // Smooth scroll for navigation links

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {

            anchor.addEventListener('click', function (e) {

                e.preventDefault();

                const targetId = this.getAttribute('href');

                if (targetId === '#') {

                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    return;

                }

                const targetElement = document.querySelector(targetId);

                if (targetElement) {

                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                }

            });

        });

        

    </script>

<script>${HOMEPAGE_REVEAL_INIT_SCRIPT}</script>

<script>${HERO_SLIDESHOW_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>

<script>${TESTIMONIALS_MARQUEE_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_CAROUSEL_INIT_SCRIPT}</script>

<script>${HOMEPAGE_GALLERY_REVEAL_SCRIPT}</script>

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId, homepageCopy)}</script>

</body>

</html>

  `;



  // DARK THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA

  const DarkTheme = () => `

<!DOCTYPE html>

<html class="dark" ${htmlAttrs}>

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Rubik:wght@500;600;700;800&family=Space+Grotesk:wght@300;700;800&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<style>

        :root {

            --headline-font: 'Space Grotesk', sans-serif;

            --about-title-font: 'Rubik', 'Heebo', sans-serif;

            --accent-pink: ${primaryColor};

            --deep-charcoal: "#121217";

            --light-bg: "#FAFAFA";

        }

        body {

            background-color: var(--deep-charcoal);

            color: #F5F5F0;

            font-family: 'Heebo', sans-serif;

            overflow-x: hidden;

            -webkit-font-smoothing: antialiased;

        }

        .hero-clamp {

            font-size: clamp(3rem, 10vw, 7rem);

            line-height: 0.95;

            letter-spacing: -0.02em;

        }

        .material-symbols-outlined {

            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;

        }

        ::-webkit-scrollbar {

            width: 4px;

        }

        ::-webkit-scrollbar-track {

            background: #121217;

        }

        ::-webkit-scrollbar-thumb {

            background: ${primaryColor};

        }

        .section-transition-light {

            background-color: #ffffff;

            color: var(--deep-charcoal);

        }

        .reveal {

            opacity: 0;

            transform: translateY(30px);

            transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);

        }

        .reveal.active {

            opacity: 1;

            transform: translateY(0);

        }

        .stagger-item {

            opacity: 0;

            transform: translateY(20px);

            transition: opacity 0.8s ease-out, transform 0.8s ease-out;

        }

        .reveal.active .stagger-item {

            opacity: 1;

            transform: translateY(0);

        }

        .stagger-item:nth-child(1) { transition-delay: 0.1s; }

        .stagger-item:nth-child(2) { transition-delay: 0.2s; }

        .stagger-item:nth-child(3) { transition-delay: 0.3s; }

        .stagger-grid-item {

            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);

        }

        .btn-fuchsia-transition {

            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

        }

        .about-section-label {

            font-family: 'Heebo', sans-serif;

            font-size: 11px;

            letter-spacing: 0.32em;

            text-transform: uppercase;

            color: color-mix(in srgb, ${primaryColor} 72%, #f5f5f0);

        }

        .theme-bold .about-title {

            font-family: var(--about-title-font);

            font-size: clamp(2.5rem, 5vw, 4.5rem);

            line-height: 1.05;

            font-weight: 800;

            font-style: normal;

            letter-spacing: 0.02em;

            color: transparent !important;

            -webkit-text-fill-color: transparent;

            -webkit-text-stroke: 1.5px ${primaryColor};

            paint-order: stroke fill;

            text-shadow: ${aboutHollowTitleAmbientShadow};

        }

        .theme-bold .about-title-underline {

            color: transparent !important;

            -webkit-text-fill-color: transparent;

            border-bottom: none;

            padding-bottom: 0;

        }

        .about-body-primary {

            font-family: 'Heebo', sans-serif;

            font-size: 18px;

            line-height: 1.9;

            color: rgba(245, 245, 240, 0.82);

        }

        .about-body-secondary {

            font-family: 'Heebo', sans-serif;

            font-size: 16px;

            line-height: 1.85;

            color: rgba(245, 245, 240, 0.65);

        }

        .about-stat-number {

            font-family: 'Frank Ruhl Libre', serif;

            font-size: clamp(2rem, 3vw, 2.75rem);

            line-height: 1;

            font-weight: 400;

            color: #F5F5F0;

        }

        .about-stat-label {

            font-family: 'Heebo', sans-serif;

            font-size: 11px;

            letter-spacing: 0.08em;

            color: rgba(245, 245, 240, 0.42);

            margin-top: 10px;

        }

        .about-image-quote {

            background: rgba(255, 255, 255, 0.97);

            padding: 22px 26px;

            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);

        }

        .about-image-quote-line {

            width: 36px;

            height: 1px;

            background: ${primaryColor};

            margin: 14px 0 10px auto;

        }

        .about-image-quote-name {

            font-family: 'Heebo', sans-serif;

            font-size: 10px;

            letter-spacing: 0.3em;

            text-transform: uppercase;

            color: ${primaryColor};

            text-align: left;

        }

        .about-glow {

            position: absolute;

            pointer-events: none;

            z-index: 0;

            border-radius: 9999px;

            filter: blur(58px);

        }

        .about-glow-left {

            top: 0;

            left: 0;

            width: 440px;

            height: 440px;

            transform: translate(-58%, -28%);

            opacity: 0.72;

        }

        #about .about-inner {

            max-width: 80rem;

            margin-inline: auto;

            padding-inline: clamp(1.5rem, 5vw, 4rem);

            width: 100%;

        }

        .bold-nav .bold-nav-brand,

        .bold-nav .bold-nav-link,

        .bold-nav .bold-nav-menu-btn {

            color: #ffffff;

            transition: color 0.7s ease;

        }

        .bold-nav .bold-nav-link:hover,

        .bold-nav .bold-nav-menu-btn:hover {

            color: rgba(255, 255, 255, 0.75);

        }

        .bold-nav .bold-nav-logo:not(.brand-logo-colorable) {

            transition: filter 0.7s ease;

            filter: brightness(0) invert(1) !important;

        }

        .bold-nav:not(.nav-scrolled) .bold-nav-logo:not(.brand-logo-colorable) {

            filter: brightness(0) invert(1) !important;

        }

        .bold-nav.nav-scrolled .bold-nav-brand {

            color: #F5F5F0;

        }

        .bold-nav.nav-scrolled .bold-nav-link {

            color: #B8B8C0;

        }

        .bold-nav.nav-scrolled .bold-nav-link:hover {

            color: ${primaryColor};

        }

        .bold-nav.nav-scrolled .bold-nav-menu-btn {

            color: #F5F5F0;

        }

        .bold-nav.nav-scrolled .bold-nav-menu-btn:hover {

            color: ${primaryColor};

        }

        .bold-nav.nav-scrolled .bold-nav-logo:not(.brand-logo-colorable) {

            filter: brightness(0) invert(1) !important;

        }

        .bold-nav .bold-nav-brand .text-primary {

            color: ${primaryColor};

        }

        .modern-section-subtitle {

            color: ${primaryColor};

        }

        .bold-hero-image {

            opacity: 0.8;

            filter: grayscale(12%) brightness(1.02) contrast(1.02) saturate(0.92);

        }

        .bold-hero-overlay {

            background: linear-gradient(

                to top,

                rgba(18, 18, 23, 0.78) 0%,

                rgba(18, 18, 23, 0.06) 45%,

                rgba(18, 18, 23, 0.42) 100%

            );

        }

        .bold-hero-bottom-merge {

            position: absolute;

            left: 0;

            right: 0;

            bottom: 0;

            z-index: 1;

            height: min(28vh, 16rem);

            pointer-events: none;

            background: linear-gradient(

                to bottom,

                rgba(18, 18, 23, 0) 0%,

                rgba(18, 18, 23, 0.65) 62%,

                #121217 100%

            );

        }

        .bold-hero-content {

            position: absolute;

            z-index: 10;

            bottom: 0;

            right: 0;

            left: auto;

            width: 100%;

            max-width: 40rem;

            min-height: min(72vh, 38rem);

            display: flex;

            flex-direction: column;

            align-items: flex-start;

            justify-content: flex-end;

            gap: 5px;

            padding: 1.5rem 1.5rem 2.25rem 1.5rem;

            text-align: right;

        }

        .bold-hero-content::before {

            content: '';

            margin-top: auto;

            flex: 0 0 30px;

            height: 30px;

            width: 100%;

        }

        .bold-hero-label {

            font-family: 'Heebo', sans-serif;

            font-size: 13px;

            font-weight: 800;

            line-height: 1;

            letter-spacing: 0.3em;

            text-transform: uppercase;

            color: ${primaryColor};

            margin: 0;

        }

        .bold-hero-title {

            font-size: clamp(2.25rem, 5.5vw, 4.25rem);

            line-height: 0.92;

            font-weight: 800;

            letter-spacing: -0.02em;

            margin: 0;

        }

        .bold-hero-title .text-primary,
        .bold-hero-title .font-light {

            color: ${primaryColor};

            font-weight: 800;

        }

        .bold-hero-about {

            margin: 0;

            line-height: 1.35 !important;

        }

        .bold-hero-actions {

            display: flex;

            flex-direction: column;

            align-items: flex-start;

            gap: 0.875rem;

            flex-shrink: 0;

            margin-top: 0;

        }

        .bold-hero-btn-gallery {

            width: fit-content;

            max-width: 100%;

            padding-inline: 1.5rem;

        }

        @media (min-width: 640px) {

            .bold-hero-actions {

                flex-direction: row;

                align-items: center;

            }

        }

        @media (min-width: 768px) {

            .bold-hero-content {

                padding: 2rem 2.5rem 2.75rem 1.5rem;

            }

        }

        .bold-contact-details {

            background-color: #121217;

            backdrop-filter: none;

            -webkit-backdrop-filter: none;

        }

        .bold-contact-details__item {

            display: flex;

            flex-direction: column;

            align-items: center;

            gap: 0.75rem;

            min-width: 8.75rem;

            text-align: center;

        }

        .bold-contact-details__icon {

            font-size: 1.75rem;

            color: ${primaryColor};

        }

        .bold-contact-details__label {

            font-family: 'Heebo', sans-serif;

            font-size: 10px;

            text-transform: uppercase;

            letter-spacing: 0.3em;

            opacity: 0.45;

        }

        .bold-contact-details__value {

            font-weight: 400;

            opacity: 0.75;

            font-size: 0.95rem;

            line-height: 1.5;

            max-width: 14rem;

        }

        .bold-contact-form-block.contact-section-has-bg {

            padding-bottom: 2.5rem;

        }

        @media (min-width: 768px) {

            .bold-contact-form-block.contact-section-has-bg {

                padding-bottom: 3.5rem;

            }

        }

        .bold-contact-details-block {

            position: relative;

            z-index: 2;

            background-color: #121217;

        }

        @media (max-width: 767px) {

            .bold-hero-content {

                left: 0;

                right: 0;

                margin-inline: auto;

                display: flex;

                flex-direction: column;

                align-items: center;

                text-align: center;

            }

            .bold-hero-actions {

                align-items: center;

            }

            .bold-hero-btn-gallery {

                white-space: nowrap;

                padding-inline: 1rem;

                letter-spacing: 0.08em;

            }

            #about .about-inner .grid {

                justify-items: center;

                text-align: center;

            }

            #about .about-inner .grid > div {

                display: flex;

                flex-direction: column;

                align-items: center;

                text-align: center;

                width: 100%;

            }

            #about .grid.grid-cols-3 {

                margin-inline: auto;

            }

            #about .grid.grid-cols-3 > div {

                text-align: center;

            }

            .homepage-gallery-header,

            .recent-photos-header {

                text-align: right !important;

            }

            #contact .bold-contact-form-block .contact-section-content {

                text-align: center;

            }

            #contact form {

                width: 100%;

                max-width: none;

                text-align: center;

            }

            #contact form > div {

                width: 100%;

            }

            #contact form input,

            #contact form textarea {

                width: 100%;

                text-align: center;

            }

            #contact .bold-contact-details-block {

                text-align: center;

            }

            #contact .bold-contact-details {

                width: 100%;

                max-width: none;

                margin-inline: 0;

            }

            #contact .bold-contact-details > div {

                flex-direction: column;

                align-items: center;

                gap: 2rem;

            }

            #contact .bold-contact-details__item {

                width: 100%;

                max-width: none;

            }

            #contact .bold-contact-details__value {

                max-width: none;

            }

        }

        ${UNIFIED_GALLERY_GRID_CSS}

        ${HOMEPAGE_PACKAGES_GRID_CSS}

        ${POSTS_PACKAGES_TRANSITION_CSS}

        ${CLASSIC_PACKAGES_ROWS_CSS}

        ${BOLD_PACKAGES_ROWS_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${MODERN_FAQ_ACCORDION_CSS}

        ${FAQ_SECTION_GLOW_CSS}

        ${HERO_SLIDESHOW_CSS}

        ${sectionBgCss}

        #contact .bold-contact-form-block.contact-section-has-bg .contact-section-bg-desktop,

        #contact .bold-contact-form-block.contact-section-has-bg .contact-section-bg-mobile,

        #pricing.contact-section-has-bg .contact-section-bg-desktop,

        #pricing.contact-section-has-bg .contact-section-bg-mobile {

            opacity: 0.48;

            filter: grayscale(6%) brightness(1.42) contrast(0.9) saturate(0.66);

            -webkit-mask-image: none;

            mask-image: none;

        }

        #contact .bold-contact-form-block.contact-section-has-bg .contact-section-bg-overlay {

            background: linear-gradient(

                to top,

                #121217 0%,

                rgba(18, 18, 23, 0.55) 14%,

                rgba(18, 18, 23, 0.02) 42%,

                rgba(18, 18, 23, 0.18) 100%

            );

        }

        #pricing.contact-section-has-bg .contact-section-bg-overlay {

            background: linear-gradient(

                to bottom,

                color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fdf8f7)) 62%, transparent),

                color-mix(in srgb, var(--contact-fade-desktop, var(--contact-fade, #fdf8f7)) 97%, transparent)

            );

        }

        ${HOMEPAGE_LTR_CSS}

        ${generateSiteNavMobileStyles()}

    </style>

<script id="tailwind-config">

        tailwind.config = {

            darkMode: "class",

            theme: {

                extend: {

                    colors: {

                        "primary": "${primaryColor}",

                        "on-primary": "#F5F5F0",

                        "background": "#121217",

                        "surface": "#1A1A22",

                        "light-surface": "#FAFAFA",

                        "on-surface": "#F5F5F0",

                        "on-surface-variant": "#B8B8C0",

                        "outline": "#F5F5F0",

                        "outline-variant": "#3D3D4D",

                        "surface-container-low": "#1E1E26",

                        "surface-dim": "#0D0D12"

                    },

                    borderRadius: {

                        "DEFAULT": "0px",

                        "lg": "0px",

                        "xl": "0px",

                        "full": "0px"

                    },

                    spacing: {

                        "xl": "64px",

                        "md": "20px",

                        "xxl": "120px",

                        "xs": "6px",

                        "sm": "12px",

                        "lg": "32px"

                    },

                    fontFamily: {

                        "headline-md": ["var(--headline-font)"],

                        "display-lg": ["var(--headline-font)"],

                        "headline-sm": ["var(--headline-font)"],

                        "body-md": ["Heebo"],

                        "label-sm": ["Heebo"],

                    },

                    fontSize: {

                        "headline-md": ["32px", {"lineHeight": "1.2", "fontWeight": "800"}],

                        "headline-sm": ["24px", {"lineHeight": "1.3", "fontWeight": "700"}],

                        "display-lg": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800"}],

                        "body-md": ["17px", {"lineHeight": "1.7", "fontWeight": "400"}],

                        "label-sm": ["13px", {"lineHeight": "1", "letterSpacing": "0.08em", "fontWeight": "500"}]

                    }

                }

            }

        }

    </script>

</head>

<body class="theme-bold bg-background text-on-surface">

${generateSiteNav(siteChrome('dark'))}

<main>

<section class="relative h-screen w-full flex items-end overflow-hidden reveal" id="hero">

<div class="absolute inset-0 z-0">

${heroSlideshowBoldHtml}

<div class="bold-hero-overlay absolute inset-0"></div>

<div class="bold-hero-bottom-merge"></div>

</div>

<div class="bold-hero-content">

<span class="bold-hero-label block">${homepageCopy.hero.premiumStudio}</span>

<h1 class="bold-hero-title text-on-surface">

                    ${brandLastWord(studioName)}

                </h1>

<p class="bold-hero-about font-body-md text-body-md max-w-xl text-on-surface-variant whitespace-pre-line">

                    ${aboutTextHtml}

                </p>

<div class="bold-hero-actions flex flex-col sm:flex-row">

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="bold-hero-btn-gallery border border-primary text-primary bg-transparent py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary hover:text-on-primary whitespace-nowrap">

                        ${homepageCopy.hero.viewGalleryShort}

                    </button>

<button onclick="document.querySelector('#about').scrollIntoView({behavior: 'smooth'})" class="text-on-surface font-label-sm uppercase tracking-widest border-b border-on-surface/30 hover:border-primary btn-fuchsia-transition py-xs">

                        ${homepageCopy.hero.ourStory}

                    </button>

</div>

</div>

</section>

${aboutTitle || aboutSubtitle || aboutDescription ? `

<section class="relative w-full py-xl md:py-xxl reveal overflow-hidden" id="about">

<div class="about-glow about-glow-left" style="background: radial-gradient(circle, ${primaryColor}70 0%, ${primaryColor}45 24%, ${primaryColor}22 46%, transparent 72%);"></div>

<div class="about-inner relative z-10">

<div class="grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-xxl items-center">

<div class="lg:col-span-5 relative">

${about_image_url ? `<img alt="${homepageCopy.misc.photographerPortraitAlt}" class="w-full aspect-[4/5] object-cover" src="${about_image_url}"/>` : ''}

<div class="about-image-quote absolute -bottom-10 -right-6 md:-right-12 max-w-[260px] hidden md:block">

<div class="about-image-quote-line"></div>

<p class="about-image-quote-name">— ${photographerName}</p>

</div>

</div>

<div class="lg:col-span-7 max-w-2xl">

<span class="about-section-label block mb-6">${homepageCopy.about.label}</span>

${aboutTitle ? `<h2 class="about-title mb-8">${underlineLastWord(aboutTitle)}</h2>` : `<h2 class="about-title mb-8">${underlineLastWord(homepageCopy.about.darkDefaultTitle)}</h2>`}

<div class="space-y-5">

${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}

</div>

${hasStats ? `

<div class="grid grid-cols-3 gap-lg pt-12 mt-4 max-w-xl">

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsClients)}</div>

<div class="about-stat-label">${homepageCopy.stats.happyClients}</div>

</div>

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsProjects)}</div>

<div class="about-stat-label">${homepageCopy.stats.portfolios}</div>

</div>

<div class="text-start rtl:text-right">

<div class="about-stat-number">${formatStat(statsYears)}</div>

<div class="about-stat-label">${homepageCopy.stats.yearsExperience}</div>

</div>

</div>

` : ''}

</div>

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section py-xl md:py-xxl" id="gallery">

<div class="homepage-gallery-header px-lg mb-lg md:mb-xxl text-start rtl:text-right homepage-gallery-reveal">

<div>

<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">${homepageCopy.sections.selectedPortfolio}</span>

<h2 class="font-headline-md text-headline-md">${homepageCopy.sections.selectedPortfolio}</h2>

</div>

</div>

<div class="homepage-gallery-grid homepage-gallery-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'dark', siteLanguage)}

</div>

</section>

` : ''}

${galleries.some((g) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header text-start rtl:text-right">

<div class="flex flex-row-reverse justify-between items-end">

<div>

<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Latest</span>

<h2 class="font-headline-md text-headline-md">${homepageCopy.sections.recentPhotos}</h2>

</div>

${portfolioCtaHtml}

</div>

</div>

<div class="recent-photos-grid recent-photos-grid--dark">

${generateRecentPhotosGridHTML(galleries, 'dark')}

</div>

</section>

` : ''}

${postsSectionHtml}

${hasPackages ? `

<section class="homepage-packages-section py-xxl reveal relative overflow-hidden" id="pricing">

${aboutAmbientBackgroundHtml}

<div class="homepage-packages-section__inner contact-section-content relative z-10">

<div class="homepage-packages-section__header stagger-reveal" data-reveal-delay="0">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">${escapeHtml(packagesSectionCopy.subtitle)}</span>

<h2 class="font-headline-md text-headline-md text-on-surface">${escapeHtml(packagesSectionCopy.title)}</h2>

<div class="homepage-packages-section__divider w-12 h-px bg-outline-variant mt-md"></div>

</div>

<div class="homepage-packages-rows">${generatePackagesHTML('dark')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section py-xxl reveal" id="testimonials">

<div class="testimonials-section__inner contact-section-content relative z-10">

<div class="testimonials-section__header stagger-reveal" data-reveal-delay="0">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">${escapeHtml(testimonialsSectionSubtitle)}</span>

<h2 class="font-headline-md text-headline-md text-on-surface">${escapeHtml(testimonialsSectionTitle)}</h2>

<div class="testimonials-section__divider w-12 h-px bg-outline-variant mt-md"></div>

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('dark')}</div>

</div>

</section>

` : ''}

${generateFaqSectionHTML('dark')}

<section class="py-md md:py-lg bg-background text-on-surface overflow-hidden whitespace-nowrap border-y border-white/10">

<div class="inline-block animate-marquee font-headline-sm text-[20px] md:text-headline-sm uppercase tracking-[0.2em] opacity-30">

                ${studioName}   •   Fashion Editorial   •   Glamour Reality   •   High-End Photography   •   Visual Art   •   ${studioName}   •   Fashion Editorial   •   Glamour Reality   •

            </div>

<style>

                @keyframes marquee {

                    0% { transform: translateX(0%); }

                    100% { transform: translateX(50%); }

                }

                .animate-marquee {

                    animation: marquee 30s linear infinite;

                }

            </style>

</section>

<section class="w-full pb-xl reveal" id="contact">

<div class="bold-contact-form-block ${hasContactBg ? 'contact-section-has-bg pt-xl md:pt-xxl' : 'container mx-auto px-lg pt-xl md:pt-xxl'}">

${hasContactBg ? contactBgLayers('#120f0d', '#1a1614') : ''}

<div class="max-w-4xl mx-auto text-center contact-section-content${hasContactBg ? ' container px-lg' : ''}">

<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">${homepageCopy.sections.contactDarkHeading}</span>

<h2 class="font-headline-md text-headline-md mb-md">${escapeHtml(contactSectionCopy.title)}</h2>

<p class="font-body-md mb-xl text-on-surface-variant max-w-xl mx-auto opacity-70">${escapeHtml(contactSectionCopy.subtitle)}</p>

<form class="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-2xl mx-auto text-start rtl:text-right">

<div class="border-b border-outline-variant">

<input name="name" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 ${contactAlign}" placeholder="${homepageCopy.contactForm.fullName}" required="" type="text"/>

</div>

<div class="border-b border-outline-variant">

<input name="email" ${contactLtrDir} class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.emailAddress}" required="" type="email"/>

</div>

<div class="border-b border-outline-variant">

<input name="phone" ${contactLtrDir} class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 ${contactLtrAlign}" placeholder="${homepageCopy.contactForm.placeholders.phone}" type="tel"/>

</div>

<div class="border-b border-outline-variant">

<input name="subject" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 ${contactAlign}" placeholder="${homepageCopy.contactForm.placeholders.subject}" type="text"/>

</div>

<div class="md:col-span-2 border-b border-outline-variant">

<textarea name="message" required class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 min-h-[120px] ${contactAlign}" placeholder="${homepageCopy.contactForm.yourMessage}"></textarea>

</div>

${generateContactPrivacyConsentHTML('dark', primaryColor, homepageCopy, 'md:col-span-2')}

<div class="md:col-span-2 flex justify-center mt-md">

<button type="submit" class="bg-primary text-on-primary px-xxl py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary/90 active:scale-95">

            ${homepageCopy.contactForm.submit}

        </button>

</div>

</form>

${hasContactBg ? '' : generateBoldContactDetailsHTML()}

</div>

</div>

${hasContactBg ? `<div class="bold-contact-details-block max-w-4xl mx-auto container px-lg">${generateBoldContactDetailsHTML()}</div>` : ''}

</section>

</main>

${generateSiteFooter(siteChrome('dark'))}

<script>${HOMEPAGE_REVEAL_INIT_SCRIPT}</script>

<script>

        ${generateSiteNavScrollScript('dark')}

        ${generateLogoColoringScript()}

        

        // Smooth scroll for navigation links

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {

            anchor.addEventListener('click', function (e) {

                e.preventDefault();

                const targetId = this.getAttribute('href');

                if (targetId === '#') {

                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    return;

                }

                const targetElement = document.querySelector(targetId);

                if (targetElement) {

                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                }

            });

        });

    </script>

<script>${HERO_SLIDESHOW_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>

<script>${TESTIMONIALS_MARQUEE_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_CAROUSEL_INIT_SCRIPT}</script>

<script>${HOMEPAGE_GALLERY_REVEAL_SCRIPT}</script>

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId, homepageCopy)}</script>

</body>

</html>

  `;



  // Return the appropriate theme HTML

  switch (theme) {

    case 'modern':

      return ModernTheme()

    case 'classic':

      return ClassicTheme()

    case 'dark':

      return DarkTheme()

    case 'elegant':

    default:

      return ElegantTheme()

  }

}

