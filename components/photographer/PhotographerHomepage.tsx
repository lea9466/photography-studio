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

  createSiteChromeConfig,

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
import type { PublicBlogPost } from '@/lib/public-blog-html'



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

  testimonials_title: string | null

  email: string | null

  phone: string | null

  address: string | null

  faq_items?: FaqItem[] | unknown

  should_color_logo?: boolean

  posts_page_title?: string | null

  gallery_layout_mode?: string | null

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

    overflow: hidden;

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

  .theme-classic .homepage-packages-section {

    width: 100%;

    max-width: 100%;

    overflow: hidden;

    padding-top: 120px !important;

    background: linear-gradient(to bottom, #ffffff 0%, #FAF7F4 150px, #FAF7F4 100%);

  }

  .theme-classic .homepage-packages-section__inner {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: clamp(1.5rem, 5vw, 4rem);

    box-sizing: border-box;

  }

  .theme-classic .homepage-packages-section__header {

    width: 100%;

    text-align: left !important;

    margin-bottom: 2.5rem;

  }

  .theme-classic .homepage-packages-section__header span,

  .theme-classic .homepage-packages-section__header h2 {

    text-align: left !important;

  }

  .theme-classic .homepage-packages-section__divider {

    margin-left: 0;

    margin-right: auto;

  }

  .theme-classic .testimonials-section__inner {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: clamp(1.5rem, 5vw, 4rem);

    box-sizing: border-box;

  }

  .theme-classic .testimonials-section__header {

    width: 100%;

    text-align: left !important;

    margin-bottom: 2.5rem;

  }

  .theme-classic .testimonials-section__header span,

  .theme-classic .testimonials-section__header h2 {

    text-align: left !important;

  }

  .theme-classic .testimonials-section__divider {

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

  .theme-classic .homepage-packages-rows {

    display: flex;

    flex-direction: column;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

  }

  .theme-classic .homepage-packages-row {

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

  .theme-classic .homepage-packages-row:last-child {

    border-bottom: none;

  }

  .theme-classic .homepage-packages-row--featured {

    background: rgba(250, 246, 240, 0.88);

    border-radius: 2px;

  }

  .theme-classic .homepage-packages-row__title {

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

  .theme-classic .homepage-packages-row__title p {

    text-align: right;

    direction: rtl;

  }

  .theme-classic .homepage-packages-row__title h3 {

    font-weight: 600;

  }

  .theme-classic .homepage-packages-row__badge {

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

  .theme-classic .homepage-packages-row__features {

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

  .theme-classic .homepage-packages-row__features-grid {

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

  .theme-classic .homepage-packages-row__features-grid li {

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

  .theme-classic .homepage-packages-row__features-grid li > span:not(.material-symbols-outlined) {

    min-width: 0;

    direction: rtl;

    text-align: right;

  }

  .theme-classic .homepage-packages-row__features-grid .material-symbols-outlined {

    font-size: 1.1rem;

    color: var(--primary-color, #8b6f5c);

    flex-shrink: 0;

    line-height: 1;

  }

  .theme-classic .homepage-packages-row__action {

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

  .theme-classic .homepage-packages-row__price {

    font-size: 2rem;

    font-weight: 700;

    color: var(--primary-color, #8b6f5c);

    display: flex;

    align-items: baseline;

    gap: 0.15rem;

    direction: ltr;

  }

  .theme-classic .homepage-packages-row__price-currency {

    font-size: 1rem;

    font-weight: 400;

  }

  .theme-classic .homepage-packages-row__btn {

    white-space: nowrap;

    padding: 0.65rem 1.25rem;

    font-size: 0.75rem;

    font-weight: 600;

    letter-spacing: 0.04em;

    border-radius: 2px;

    transition: all 0.3s ease;

    cursor: pointer;

  }

  .theme-classic .homepage-packages-row__btn--featured {

    background: var(--primary-color, #8b6f5c);

    color: #ffffff;

    border: none;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  }

  .theme-classic .homepage-packages-row__btn--featured:hover {

    filter: brightness(1.08);

  }

  .theme-classic .homepage-packages-row__btn--default {

    background: transparent;

    color: var(--primary-color, #8b6f5c);

    border: 1px solid rgba(139, 111, 92, 0.4);

  }

  .theme-classic .homepage-packages-row__btn--default:hover {

    background: var(--primary-color, #8b6f5c);

    color: #ffffff;

  }

  @media (max-width: 767px) {

    .theme-classic .homepage-packages-section {

      padding-top: 100px !important;

      background: linear-gradient(to bottom, #ffffff 0%, #FAF7F4 120px, #FAF7F4 100%);

    }

    .theme-classic .homepage-packages-section__inner {

      padding-inline: clamp(1rem, 4vw, 1.5rem);

    }

    .theme-classic .homepage-packages-row {

      display: flex;

      flex-direction: column;

      align-items: stretch;

      justify-content: flex-start;

      gap: 1.25rem;

      padding: 1.5rem 0;

      direction: rtl;

    }

    .theme-classic .homepage-packages-row__title {

      grid-column: auto;

      justify-self: stretch;

      flex: none;

      width: 100%;

      min-width: 0;

      max-width: none;

      text-align: right;

    }

    .theme-classic .homepage-packages-row__features {

      grid-column: auto;

      justify-self: start;

      margin-inline-start: 0;

      width: 100%;

    }

    .theme-classic .homepage-packages-row__features-grid {

      grid-template-columns: 1fr;

      gap: 12px;

      width: 100%;

      max-width: 100%;

    }

    .theme-classic .homepage-packages-row__features-grid li {

      white-space: normal;

      width: 100%;

      max-width: 100%;

    }

    .theme-classic .homepage-packages-row__badge {

      position: static;

      margin-bottom: 0.5rem;

    }

    .theme-classic .homepage-packages-row__action {

      grid-column: auto;

      justify-self: stretch;

      flex-direction: row;

      justify-content: space-between;

      align-items: center;

      width: 100%;

      min-width: 0;

      margin-left: 0;

    }

    .theme-classic .homepage-packages-row__btn {

      flex-shrink: 0;

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



function elegantFaqSectionCss(primaryColor: string) {

  return `

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

  }

  .faq-grid-elegant {

    display: grid;

    grid-template-columns: repeat(1, minmax(0, 1fr));

    gap: 3px;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

    box-sizing: border-box;

    align-items: stretch;

  }

  @media (min-width: 640px) {

    .faq-grid-elegant {

      grid-template-columns: repeat(2, minmax(0, 1fr));

      gap: 4px;

    }

  }

  @media (min-width: 768px) {

    .faq-grid-elegant {

      grid-template-columns: repeat(3, minmax(0, 1fr));

      gap: 4px;

    }

  }

  .faq-card-elegant {

    background: #ffffff;

    border-radius: 0;

    padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1rem, 2.5vw, 1.5rem);

    text-align: center;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: flex-start;

    gap: 0.75rem;

    min-height: clamp(10rem, 24vw, 13rem);

    width: 100%;

    height: 100%;

    box-shadow: none;

    border: 1px solid rgba(15, 15, 13, 0.06);

  }

  .faq-card-elegant__question {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(1rem, 2.4vw, 1.125rem);

    font-weight: 400;

    line-height: 1.55;

    color: ${primaryColor};

    margin: 0;

  }

  .faq-card-elegant__answer {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(0.8125rem, 2.1vw, 0.975rem);

    font-weight: 300;

    line-height: 1.75;

    color: #0F0F0D;

    margin: 0;

    white-space: pre-line;

  }`

}



function classicFaqSectionCss(primaryColor: string) {

  return `

  .faq-grid-classic {

    display: grid;

    grid-template-columns: repeat(1, minmax(0, 1fr));

    gap: 3px;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

    box-sizing: border-box;

    align-items: stretch;

  }

  @media (min-width: 640px) {

    .faq-grid-classic {

      grid-template-columns: repeat(2, minmax(0, 1fr));

      gap: 4px;

    }

  }

  @media (min-width: 768px) {

    .faq-grid-classic {

      grid-template-columns: repeat(3, minmax(0, 1fr));

      gap: 4px;

    }

  }

  .faq-card-classic {

    background: #ffffff;

    border-radius: 4px;

    padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1rem, 2.5vw, 1.5rem);

    text-align: center;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: flex-start;

    gap: 0.75rem;

    min-height: clamp(10rem, 24vw, 13rem);

    width: 100%;

    height: 100%;

    border: 1px solid rgba(0, 0, 0, 0.06);

    box-shadow: none;

    transition: border-color 0.3s ease;

  }

  .faq-card-classic:hover {

    border-color: ${primaryColor}40;

  }

  .faq-card-classic__question {

    font-family: var(--headline-font, 'Heebo'), 'Heebo', sans-serif;

    font-size: clamp(1rem, 2.3vw, 1.2rem);

    font-weight: 600;

    line-height: 1.45;

    color: ${primaryColor};

    margin: 0;

  }

  .faq-card-classic__answer {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(0.875rem, 2vw, 1rem);

    font-weight: 400;

    line-height: 1.7;

    color: #5a504a;

    margin: 0;

    white-space: pre-line;

  }`

}



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

  .testimonials-section--modern .testimonials-section-grid {
    padding-top: 1rem;
    padding-bottom: 1.5rem;
  }

  .testimonials-section--modern .testimonials-marquee {
    padding-top: 1rem;
    padding-bottom: 1.5rem;
  }

  .testimonials-section--modern .classic-testimonials-carousel {
    padding-bottom: 2rem;
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



function fillGalleriesToFour(galleries: Gallery[]): Gallery[] {

  if (galleries.length === 0) return []

  if (galleries.length >= 4) return galleries.slice(0, 4)

  const filled = [...galleries]

  while (filled.length < 4) {

    const source = galleries[filled.length % galleries.length]

    filled.push({ ...source, id: `${source.id}-fill-${filled.length}` })

  }

  return filled

}



function galleryNavId(id: string) {

  return id.replace(/-fill-\d+$/, '')

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

  themeVariant: GalleryThemeVariant

): string {

  const display = fillGalleriesToFour(galleries)

  if (display.length === 0) return ''



  const radius = GALLERY_RADIUS_BY_THEME[themeVariant]



  return display

    .map((g) => {

      const year = new Date(g.created_at).getFullYear()

      const galleryUrl = `/public-gallery/${galleryNavId(g.id)}`

      const title = escapeGalleryText(String(g.title))

      const preview = g.preview_url

      const previewHtml = preview

        ? `<div class="homepage-gallery-card-media"><img alt="${title}" class="homepage-gallery-card-image" src="${preview}" loading="eager" decoding="async" fetchpriority="high" /></div>`

        : ''



      return `<a href="${galleryUrl}" target="_parent" class="homepage-gallery-card group" style="border-radius: ${radius}">

${previewHtml}

<div class="homepage-gallery-card-overlay"></div>

<div class="homepage-gallery-card-content" dir="rtl">

<p class="homepage-gallery-card-label">סדרה</p>

<h3 class="homepage-gallery-card-title">${title}</h3>

<p class="homepage-gallery-card-subtitle">${year}</p>

<span class="homepage-gallery-card-cta"><span class="homepage-gallery-card-arrow">←</span> לצפייה בגלריה</span>

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



  const rows = fillGalleriesToFour(withPhotos)

  // Track how many times each real gallery was used so duplicated rows

  // pull a different slice of photos from the same pool.

  const usage: Record<string, number> = {}



  let cellIndex = 0

  const rowsHtml = rows

    .map((g) => {

      const pool = g.photo_pool ?? []

      const baseId = galleryNavId(g.id)

      const galleryUrl = `/public-gallery/${baseId}`

      const used = usage[baseId] ?? 0

      usage[baseId] = used + 1

      const photos = pickRowPhotos(pool, used * 4, 4)

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

  primaryColor: string

): string {

  return `

<div class="portfolio-cta-wrap">

${generateHomepageMoreLinkHTML({

  href: portfolioPath,

  label: 'לכל התמונות',

  primaryColor,

  includeStyles: true,

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

  posts?: PublicBlogPost[]

}



export function PhotographerHomepage({ photographer, galleries = [], packages = [], testimonials = [], postCount = 0, blogPath, portfolioPath, posts = [] }: PhotographerHomepageProps) {

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

      posts,

      window.location.origin

    )

    setHtml(generatedHtml)

  }, [photographer, galleries, packages, testimonials, postCount, blogPath, portfolioPath, posts])



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

        style={{ width: '100%', height: '100vh', border: 'none' }}

        title="Photographer Homepage"

      />

    </main>

  )

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

  wrapperClass = ''

): string {

  const labelTextClass = {

    elegant: 'text-sm font-light opacity-80 leading-relaxed',

    modern: 'text-sm text-white/90 leading-relaxed',

    classic: 'text-sm text-on-surface-variant leading-relaxed',

    dark: 'text-sm text-on-surface-variant leading-relaxed',

  }[theme]



  const linkClass = {

    elegant: 'underline hover:opacity-80',

    modern: 'underline text-white hover:opacity-80',

    classic: 'text-primary underline hover:opacity-80',

    dark: 'text-primary underline hover:opacity-80',

  }[theme]



  return `

<div class="contact-privacy-consent flex items-start gap-sm text-right ${wrapperClass}">

<input type="checkbox" name="privacy_consent" id="contact_privacy_consent_${theme}" required class="contact-privacy-checkbox mt-1 shrink-0 size-4 cursor-pointer rounded border border-current/30" style="accent-color: ${primaryColor};"/>

<p class="${labelTextClass}">

<label for="contact_privacy_consent_${theme}" class="cursor-pointer">אני מסכימ/ה לשמירת המידע האישי שלי לצורך טיפול בפנייה , בהתאם ל</label><a href="/privacy" class="${linkClass}">מדיניות הפרטיות</a>.

</p>

</div>`.trim()

}



function contactFormSubmitScript(photographerId: string): string {

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

          submitBtn.textContent = 'שולח...';

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

          if (!result.ok) throw new Error(result.data.error || 'שגיאה בשליחה');

          var section = document.querySelector('#contact .contact-section-content') || document.querySelector('#contact');

          if (section) {

            section.innerHTML = '<div class="text-center py-16"><p class="text-xl font-medium mb-2">הפנייה נשלחה בהצלחה ✓</p><p class="opacity-70">ניצור איתך קשר בהקדם.</p></div>';

          }

        })

        .catch(function(err) {

          alert(err.message || 'שגיאה בשליחה');

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

    testimonials_title,

    email,

    phone,

    address,

  } = photographer



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

  const aboutAmbientBackgroundHtml =

    theme === 'elegant'

      ? `<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70" aria-hidden="true"></div>`

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

          primaryColor

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

    alt: studio_name || 'סטודיו צילום',

  })

  const heroSlideshowModernHtml = generateModernHeroFilmBeltHTML({

    desktopImages: desktopHeroImages,

    mobileImages: mobileHeroImages,

    alt: studio_name || 'סטודיו צילום',

    heroId: 'hero-slideshow-modern',

  })

  const heroSlideshowBoldHtml = generateHeroSlideshowHTML({

    desktopImages: desktopHeroImages,

    mobileImages: mobileHeroImages,

    alt: studio_name || 'סטודיו צילום',

    heroId: 'hero-slideshow-bold',

    imgClass: 'bold-hero-image',

  })

  const aboutImageHtml = about_image_url

    ? `<img alt="צילום פורטרט" class="w-full h-full object-cover" src="${about_image_url}"/>`

    : ''



  const studioName = studio_name || name || 'סטודיו גלריה'

  const documentHead = generatePhotographerDocumentHead(
    studioName,
    logo_url,
    faviconOrigin,
    photographerId
  )

  const photographerName = name || 'אפרת כהן'

  const validFaqItems = sanitizeFaqItems(parseFaqItems(photographer.faq_items))

  const hasFaq = validFaqItems.length > 0

  const sectionScrollScript = generateHomepageSectionScrollScript(initialSection)



  const siteChrome = (themeKey: SiteChromeTheme) =>

    createSiteChromeConfig({

      theme: themeKey,

      studioName,

      logoUrl: logo_url,

      primaryColor,

      homepagePath: '/',

      linkMode: 'scroll',

      shouldColorLogo: photographer.should_color_logo ?? false,

      hasFaq,

      hasPackages: packages.length > 0,

      hasBlog: postCount > 0,

      blogPath,

      galleryLayoutMode:
        (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'
          ? 'portfolio'
          : 'separated',

      portfolioPath:
        (photographer.gallery_layout_mode ?? 'separated') === 'portfolio'
          ? portfolioPath
          : undefined,

    })

  const postsSectionHtml = generateHomepagePostsSectionHTML({
    posts,
    theme: theme as SiteChromeTheme,
    primaryColor,
    sectionTitle: resolvePostsPageTitle(theme, photographer.posts_page_title),
    blogHref: blogPath ?? '#',
    showAllLink: postCount > 0,
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

  const packagesSectionCopy = resolvePackagesSectionCopy(theme, packages_title, packages_subtitle)

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

    testimonials_title

  )

  const testimonialsSectionSubtitle = resolveTestimonialsSectionSubtitle(theme)

  const formatStat = (value: number) => (value > 0 ? `${value}+` : `${value}`)



  // Generate dynamic packages HTML for each theme

  const packageCardBg = (solidClass: string) => solidClass



  const generatePackagesHTML = (currentTheme: string) => {

    if (packages.length === 0) return ''

    const packageList = currentTheme === 'classic' ? packages : sortedPackages

    

    return packageList.map((pkg, i) => {

      const includesList = pkg.includes || [];

      const isFeatured = pkg.is_featured;

      

      if (currentTheme === 'elegant') {

        return `

        <div class="stagger-reveal homepage-package-reveal" data-reveal-delay="${i * 100}">

        <div class="${isFeatured ? `${packageCardBg('bg-white')} border-2` : `${packageCardBg('bg-white')} border border-outline-variant`} p-10 flex flex-col h-full relative" style="direction: rtl !important; text-align: center !important; ${isFeatured ? `border-color: ${primaryColor};` : ''}">

          ${isFeatured ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-lg" style="direction: rtl !important; background-color: ${primaryColor};">הנמכרת ביותר</div>` : ''}

          <div class="text-center mb-8 ${isFeatured ? 'mt-2' : ''}" style="direction: rtl !important; text-align: center !important;">

            <h3 class="font-display text-3xl mb-2" style="direction: rtl !important; text-align: center !important; color: ${primaryColor};">${pkg.name}</h3>

            <div class="text-lg tracking-widest elegant-accent" style="direction: rtl !important; text-align: center !important; color: ${isFeatured ? primaryColor : 'inherit'};">₪${pkg.price_amount}</div>

          </div>

          <div class="border-t pt-8 mb-10 flex-grow" style="direction: rtl !important; text-align: center !important; ${isFeatured ? `border-color: ${primaryColor}20;` : 'border-color: rgba(15, 15, 13, 0.1);'}">

            <div class="mx-auto w-fit" style="direction: rtl !important;">

              <ul class="space-y-4 font-body text-base ${isFeatured ? 'text-on-surface-variant' : 'opacity-80'}" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">

                ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-4 w-full"><span class="material-symbols-outlined text-xl" style="color: ${primaryColor};">check</span> <span>${item}</span></li>`).join('')}

              </ul>

            </div>

          </div>

          <div class="mt-auto" style="direction: rtl !important; text-align: center !important;">

            <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full border border-[#0F0F0D] px-8 py-4 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all" style="direction: rtl !important; text-align: center !important;">תיאום שיחת ייעוץ</button>

          </div>

        </div>

        </div>

      `;

      } else if (currentTheme === 'modern') {

        return `

        <div class="stagger-reveal homepage-package-reveal" data-reveal-delay="${i * 100}">

        <div class="${packageCardBg('bg-white')} p-xl rounded-2xl modern-shadow border border-outline-variant flex flex-col gap-md transition-all hover:-translate-y-2 ${isFeatured ? 'border-2 border-primary' : ''}" style="direction: rtl !important; text-align: center !important;">

          ${isFeatured ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-lg py-1 rounded-full text-xs font-bold uppercase tracking-wider" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}

          <div style="direction: rtl !important; text-align: center !important;">

            <h3 class="font-headline text-2xl font-bold text-primary" style="direction: rtl !important; text-align: center !important;">${pkg.name}</h3>

            <div class="flex items-baseline gap-xs mt-sm justify-center" style="direction: rtl !important; text-align: center !important;">

              <span class="font-headline text-3xl font-bold text-primary" style="direction: rtl !important;">₪${pkg.price_amount}</span>

            </div>

          </div>

          <div class="mx-auto w-fit flex-grow my-lg" style="direction: rtl !important;">

            <ul class="flex flex-col gap-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">

              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-sm text-md"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> <span>${item}</span></li>`).join('')}

            </ul>

          </div>

          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full py-md ${isFeatured ? 'bg-primary text-white rounded-lg font-bold btn-magnetic shadow-lg shadow-indigo-100' : 'border border-primary text-primary rounded-lg font-bold btn-magnetic hover:bg-primary/5'} transition-all" style="direction: rtl !important; text-align: center !important;">

            הזמינו עכשיו

          </button>

        </div>

        </div>

      `;

      } else if (currentTheme === 'dark') {

        return `

        <div class="stagger-reveal homepage-package-reveal" data-reveal-delay="${i * 100}">

        <div class="${isFeatured ? `${packageCardBg('bg-background')} p-lg md:p-xl flex flex-col items-center text-center relative md:-translate-y-lg shadow-2xl` : `${packageCardBg('bg-background')} p-lg md:p-xl transition-all flex flex-col items-center text-center shadow-sm hover:shadow-xl group border border-white/10`}" style="direction: rtl !important; text-align: center !important;">

          ${isFeatured ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-lg py-xs font-label-sm uppercase tracking-widest" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}

          <span class="font-label-sm text-primary/60 mb-md tracking-widest uppercase" style="direction: rtl !important; text-align: center !important;">${isFeatured ? 'Professional' : 'Essential'}</span>

          <h3 class="font-headline-sm mb-sm text-primary" style="direction: rtl !important; text-align: center !important;">${pkg.name}</h3>

          <div class="text-[48px] lg:text-display-lg ${isFeatured ? 'text-primary' : 'text-on-surface'} mb-xl" style="direction: rtl !important; text-align: center !important;">₪${pkg.price_amount}</div>

          <div class="mx-auto w-fit mb-xl" style="direction: rtl !important;">

            <ul class="space-y-md text-on-surface-variant font-body-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">

              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-md w-full border-b border-white/10 pb-sm"><span class="material-symbols-outlined text-primary">check_circle</span> <span>${item}</span></li>`).join('')}

            </ul>

          </div>

          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="mt-auto w-full ${isFeatured ? 'bg-primary text-on-primary py-md font-label-sm uppercase tracking-widest hover:opacity-90 btn-fuchsia-transition' : 'border border-on-surface text-on-surface py-md font-label-sm uppercase tracking-widest hover:bg-on-surface hover:text-background btn-fuchsia-transition'}" style="direction: rtl !important; text-align: center !important;">

            ${isFeatured ? 'לבחירת החבילה' : 'הזמן עכשיו'}

          </button>

        </div>

        </div>

      `;

      } else if (currentTheme === 'classic') {

        const subtitle = pkg.duration_text || (isFeatured ? 'החוויה המלאה' : 'לרגעים קטנים ומרגשים')

        return `

        <div class="homepage-packages-row stagger-reveal${isFeatured ? ' homepage-packages-row--featured' : ''}" data-reveal-delay="${i * 100}" style="--primary-color: ${primaryColor};">

          <div class="homepage-packages-row__title">

            ${isFeatured ? '<span class="homepage-packages-row__badge">הנמכרת ביותר</span>' : ''}

            <h3 class="font-headline-sm text-headline-sm text-primary mb-xs">${pkg.name}</h3>

            <p class="font-body-md text-body-md text-on-surface-variant/60">${subtitle}</p>

          </div>

          <div class="homepage-packages-row__features" dir="rtl">

            <ul class="homepage-packages-row__features-grid">

              ${includesList.map((item: string) => `<li><span class="material-symbols-outlined">${isFeatured ? 'check_circle' : 'check'}</span><span>${item}</span></li>`).join('')}

            </ul>

          </div>

          <div class="homepage-packages-row__action">

            <div class="homepage-packages-row__price"><span class="homepage-packages-row__price-currency">₪</span>${pkg.price_amount}</div>

            <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="homepage-packages-row__btn ${isFeatured ? 'homepage-packages-row__btn--featured' : 'homepage-packages-row__btn--default'}">

              ${isFeatured ? 'בחירה בחבילה' : 'הזמנת חבילה'}

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



  const generateElegantFaqCardsHTML = () =>

    validFaqItems

      .map(

        (item, index) => `<article class="faq-card-elegant reveal-on-scroll" style="transition-delay: ${index * 80}ms">

<h3 class="faq-card-elegant__question">${escapeHtml(item.question)}</h3>

<p class="faq-card-elegant__answer">${escapeHtml(item.answer)}</p>

</article>`

      )

      .join('')



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

<span class="${prefix}-contact-details__label">טלפון</span>

<a href="tel:${studioPhoneHref}" class="${prefix}-contact-details__value ${linkHoverClass}" dir="ltr">${studioPhoneHtml}</a>

</div>`)

    }



    if (contactEmail) {

      items.push(`<div class="${prefix}-contact-details__item">

<span class="material-symbols-outlined ${prefix}-contact-details__icon">mail</span>

<span class="${prefix}-contact-details__label">אימייל</span>

<a href="mailto:${contactEmailHtml}" class="${prefix}-contact-details__value ${linkHoverClass}">${contactEmailHtml}</a>

</div>`)

    }



    if (studioAddress) {

      items.push(`<div class="${prefix}-contact-details__item">

<span class="material-symbols-outlined ${prefix}-contact-details__icon">location_on</span>

<span class="${prefix}-contact-details__label">מיקום</span>

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



  const generateClassicFaqCardsHTML = () =>

    validFaqItems

      .map(

        (item, index) => `<article class="faq-card-classic reveal" style="transition-delay: ${index * 80}ms">

<h3 class="faq-card-classic__question">${escapeHtml(item.question)}</h3>

<p class="faq-card-classic__answer">${escapeHtml(item.answer)}</p>

</article>`

      )

      .join('')



  const generateFaqSectionHTML = (currentTheme: string) => {

    if (!hasFaq) return ''



    const accordion = `<div class="faq-accordion">${generateFaqAccordionHTML(currentTheme)}</div>`



    if (currentTheme === 'elegant') {

      return `<section class="faq-section pt-8 pb-16 md:pt-12 md:pb-32 reveal-on-scroll" id="faq">

<div class="faq-section__header reveal-on-scroll">

${elegantSectionHeading('שאלות נפוצות', 'FAQ')}

<p class="font-body opacity-60 italic faq-section__subtitle">מצאו תשובות לשאלות הנפוצות ביותר</p>

</div>

<div class="faq-grid-elegant">${generateElegantFaqCardsHTML()}</div>

</section>`

    }



    if (currentTheme === 'modern') {

      return `<section class="faq-section pt-lg pb-xxl max-w-7xl mx-auto px-lg reveal-on-scroll" id="faq">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

<h2 class="font-headline text-4xl font-bold text-on-surface mb-sm">שאלות נפוצות</h2>

<p class="modern-section-subtitle">מצאו תשובות לשאלות הנפוצות ביותר</p>

</div>

${generateFaqAccordionHTML('modern')}

</section>`

    }



    if (currentTheme === 'dark') {

      return `<section class="faq-section pt-lg pb-xxl max-w-7xl mx-auto px-lg reveal" id="faq">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

<h2 class="font-headline text-4xl font-bold text-on-surface mb-sm">שאלות נפוצות</h2>

<p class="modern-section-subtitle opacity-70">מצאו תשובות לשאלות הנפוצות ביותר</p>

</div>

${generateFaqAccordionHTML('dark')}

</section>`

    }



    if (currentTheme === 'classic') {

      return `<section class="faq-section py-xxl reveal" id="faq">

<div class="faq-section__header stagger-reveal" data-reveal-delay="0">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">FAQ</span>

<h2 class="font-headline-md text-headline-md text-on-surface">שאלות נפוצות</h2>

<div class="faq-section__divider w-12 h-px bg-outline-variant mt-md"></div>

<p class="font-body-md text-body-md text-on-surface-variant mt-md faq-section__subtitle">מצאו תשובות לשאלות הנפוצות ביותר</p>

</div>

<div class="faq-grid-classic">${generateClassicFaqCardsHTML()}</div>

</section>`

    }



    return `<section class="faq-section py-xl md:py-xxl container mx-auto px-lg reveal" id="faq">

<div class="text-center mb-xl md:mb-xxl">

<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">FAQ</span>

<h2 class="font-headline-md text-headline-md">שאלות נפוצות</h2>

<p class="font-body-md text-on-surface-variant opacity-70 mt-md">מצאו תשובות לשאלות הנפוצות ביותר</p>

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



    if (variant === 'classic') {

      return `

        <div class="testimonial-thumb-card testimonial-thumb-card--classic classic-testimonial-card italic${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>

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

              <div class="flex flex-row-reverse gap-1 text-accent mb-6">

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



    if (variant === 'modern') {

      return `

        <div class="testimonial-thumb-card testimonial-thumb-card--modern italic text-lg${forMarquee ? '' : ' animate-reveal hover-scale modern-shadow'}${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>

          ${quoteHtml}

          ${thumbHtml}

          <div class="testimonial-thumb-card__content">

            <p class="testimonial-thumb-card__text">${content}</p>

            <div class="testimonial-thumb-card__footer not-italic">

              <div class="mt-md font-bold text-on-surface">${title}</div>

              ${meta ? `<div class="text-on-surface-variant text-sm mt-1">${meta}</div>` : ''}

            </div>

          </div>

        </div>

      `

    }



    return `

        <div class="testimonial-thumb-card testimonial-thumb-card--dark relative${extraClass ? ` ${extraClass}` : ''}"${delayAttr}>

          ${quoteHtml}

          ${thumbHtml}

          <div class="testimonial-thumb-card__content">

            <p class="testimonial-thumb-card__text font-body-md text-on-surface-variant mb-xl relative z-10 italic">${content}</p>

            <div class="testimonial-thumb-card__footer relative z-10">

              <div class="font-label-sm uppercase tracking-widest text-on-surface">${title}</div>

              ${meta ? `<div class="text-[10px] text-on-surface-variant">${meta}</div>` : ''}

            </div>

          </div>

        </div>

      `

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
            `<button type="button" class="classic-testimonials-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="עמוד תגובות ${i + 1}"></button>`
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

<html class="scroll-smooth" dir="rtl" lang="he" style="scroll-behavior: smooth;">

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

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${elegantFaqSectionCss(primaryColor)}

        ${HERO_SLIDESHOW_CSS}

        ${sectionBgCss}

        ${generateSiteNavMobileStyles()}

    </style>

</head>

<body class="selection:bg-[${primaryColor}] selection:text-white">

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

                    לצפייה בגלריות

                </button>

</div>

</div>

</div>

</section>

${hasStats ? `

<section class="px-margin-mobile md:px-margin-desktop py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl reveal-on-scroll">

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsYears)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">שנות ניסיון</span>

</div>

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsClients)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">לקוחות מרוצים</span>

</div>

<div class="text-center">

<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${formatStat(statsProjects)}</span>

<span class="text-xs uppercase tracking-widest opacity-60">תיקי עבודות</span>

</div>

</section>

` : ''}

${aboutTitle || aboutSubtitle || aboutDescription ? `

<section class="px-margin-mobile md:px-margin-desktop py-32 max-w-7xl mx-auto reveal-on-scroll relative" id="about">

<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70"></div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">

<div class="order-2 lg:order-1 max-w-2xl">

<span class="elegant-accent font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">About · קצת עליי</span>

${aboutTitle ? elegantSectionHeading(aboutTitle, 'ABOUT', { titleClass: 'mb-4' }) : ''}

${aboutSubtitle ? `<p class="font-body text-lg mb-6 leading-relaxed opacity-80" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="font-body text-base mb-10 opacity-60 leading-relaxed" style="white-space: pre-line">${aboutDescription}</p>` : ''}

<button onclick="document.querySelector('#gallery').scrollIntoView({behavior: 'smooth'})" class="border border-[#0F0F0D] px-10 py-3 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all duration-300">

                    לצפייה בגלריות

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

<div class="flex flex-row-reverse justify-between items-end reveal-on-scroll">

${elegantSectionHeading('קולקציות נבחרות', 'COLLECTIONS')}

</div>

</div>

<div class="homepage-gallery-grid reveal-on-scroll active">

${generateUnifiedGalleryGridHTML(galleries, 'elegant')}

</div>

</section>

` : ''}

${galleries.some((g) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header">

<div class="flex flex-row-reverse justify-between items-end">

${elegantSectionHeading('תמונות אחרונות', 'LATEST')}

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

${elegantSectionHeading('צרי קשר', 'CONTACT', { center: true, onDark: true })}

<p class="opacity-60 font-light">נשמח לשמוע ממך ולתאם את חווית הצילום המושלמת עבורך.</p>

</div>

${email ? `

<form class="grid grid-cols-1 md:grid-cols-2 gap-10">

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">שם מלא</label>

<input name="name" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="השם שלך" type="text"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">אימייל</label>

<input name="email" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="your@email.com" type="email"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">טלפון</label>

<input name="phone" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="050-0000000" type="tel"/>

</div>

<div class="space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">נושא הפנייה</label>

<input name="subject" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="נושא הפנייה" type="text"/>

</div>

<div class="md:col-span-2 space-y-2">

<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">הודעה</label>

<textarea name="message" required class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white min-h-[120px] resize-none" placeholder="איך נוכל לעזור?"></textarea>

</div>

${generateContactPrivacyConsentHTML('elegant', primaryColor, 'md:col-span-2')}

<div class="md:col-span-2 flex justify-center mt-6">

<button type="submit" class="elegant-bg-accent text-white px-16 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300">

                        שליחת הודעה

                    </button>

</div>

</form>

` : `<div class="text-center py-20 opacity-40"><p class="font-body text-lg">אין כתובת אימייל ליצירת קשר</p></div>`}

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

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId)}</script>

</body>

</html>

  `;



  // MODERN THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA

  const ModernTheme = () => `

<!DOCTYPE html>

<html class="light" dir="rtl" lang="he" style="scroll-behavior: smooth;">

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<style>

        :root {

            --headline-font: 'Space Grotesk', 'Heebo', sans-serif;

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

        .modern-homepage-gallery-section {

            padding-top: calc(clamp(3.5rem, 9vw, 6rem) + 250px) !important;

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

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${MODERN_FAQ_ACCORDION_CSS}

        ${MODERN_HERO_FILM_BELT_CSS}

        ${sectionBgCss}

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

<span class="text-primary font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">About · קצת עליי</span>

${aboutTitle ? '<h1 class="font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-white">' + aboutTitle + '</h1>' : '<h1 class="font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-white">אמנות הרגע <br/><span class="text-primary">בצורה מודרנית</span></h1>'}

${aboutSubtitle ? '<p class="text-lg md:text-xl modern-about-muted leading-relaxed" style="white-space: pre-line">' + aboutSubtitle + '</p>' : ''}

${aboutDescription ? '<p class="text-lg md:text-xl modern-about-muted leading-relaxed" style="white-space: pre-line">' + aboutDescription + '</p>' : ''}

<div class="modern-about-actions pt-md">

<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="bg-primary text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:shadow-xl shadow-indigo-200 transition-all">

                    התחילו עכשיו

                </button>

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="border border-white/40 text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:bg-white/10 transition-all">

                    לצפייה בגלריה

                </button>

</div>

</div>

<div class="hidden md:block" aria-hidden="true"></div>

</div>

</div>

</section>

` : ''}

${hasStats ? `

<section class="max-w-7xl mx-auto px-lg py-xxl">

<div class="grid grid-cols-1 md:grid-cols-3 gap-lg">

<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">photo_camera</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsProjects)}</h3>

<p class="text-on-surface-variant font-medium">תיקי עבודות</p>

</div>

<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-100 hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">groups</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsClients)}</h3>

<p class="text-on-surface-variant font-medium">לקוחות מרוצים</p>

</div>

<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-200 hover-scale">

<span class="material-symbols-outlined text-primary text-5xl">military_tech</span>

<h3 class="font-headline text-4xl font-bold text-on-surface">${formatStat(statsYears)}</h3>

<p class="text-on-surface-variant font-medium">שנות ניסיון</p>

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section modern-homepage-gallery-section" id="portfolio">

<div class="homepage-gallery-header px-lg mb-xl">

<div class="flex flex-row-reverse justify-between items-end gap-md animate-reveal">

<div class="text-right">

<h2 class="font-headline text-4xl font-bold mb-xs">העבודות האחרונות שלנו</h2>

<p class="modern-section-subtitle">מבט קצר אל הרגעים שתפסנו לאחרונה</p>

</div>

</div>

</div>

<div class="homepage-gallery-grid animate-reveal">

${generateUnifiedGalleryGridHTML(galleries, 'modern')}

</div>

</section>

` : ''}

${galleries.some((g) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section modern-recent-photos-section" id="recent-photos">

<div class="recent-photos-header">

<div class="flex flex-row-reverse justify-between items-end gap-md">

<div class="text-right">

<h2 class="font-headline text-4xl font-bold mb-xs">תמונות אחרונות</h2>

<p class="modern-section-subtitle">רגעים נבחרים מהעבודות שלנו</p>

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

<section class="py-xxl w-full" id="pricing">

<div class="max-w-7xl mx-auto px-lg">

<div class="text-center mb-xl stagger-reveal" data-reveal-delay="0">

<h2 class="font-headline text-4xl font-bold text-on-surface">${escapeHtml(packagesSectionCopy.title)}</h2>

<p class="modern-section-subtitle">${escapeHtml(packagesSectionCopy.subtitle)}</p>

</div>

<div class="${packagesGridClass}">${generatePackagesHTML('modern')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section testimonials-section--modern pt-xxl pb-lg max-w-7xl mx-auto px-lg" id="testimonials">

<h2 class="font-headline text-4xl font-bold text-center mb-xl animate-reveal">${escapeHtml(testimonialsSectionTitle)}</h2>

<div class="testimonials-section-grid">${generateTestimonialsSection('modern')}</div>

</section>

` : ''}

${generateFaqSectionHTML('modern')}

<section class="w-full ${hasContactBg ? 'contact-section-has-bg py-xxl' : 'max-w-7xl mx-auto px-lg'}" id="contact">

${contactBgLayers('#F8FAFC')}

<div class="contact-section-content">

<div class="modern-contact-card ${hasContactBg ? 'modern-contact-card--has-bg' : 'bg-primary rounded-2xl'} p-xl md:p-xxl text-white animate-reveal">

<div class="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">

<div class="modern-contact-info max-w-md text-right">

<h2 class="font-headline text-4xl font-bold mb-sm text-white">צרו איתנו קשר</h2>

<p class="text-lg opacity-90 text-white mb-lg">השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או סשן צילומים.</p>

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

<input name="name" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_name" placeholder="שם מלא" type="text"/>

</div>

<div class="relative">

<input name="email" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_email" placeholder="אימייל" type="email"/>

</div>

</div>

<div class="relative">

<input name="phone" class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_phone" placeholder="טלפון" type="tel"/>

</div>

<div class="relative">

<textarea name="message" required class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_message" placeholder="הודעה" rows="3"></textarea>

</div>

${generateContactPrivacyConsentHTML('modern', primaryColor)}

<button class="bg-white text-primary px-xl py-md rounded-lg font-bold btn-magnetic hover:shadow-xl w-full transition-all" type="submit">

                        שליחת הודעה

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

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId)}</script>

</body>

</html>

  `;



  // CLASSIC THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA

  const ClassicTheme = () => `

<!DOCTYPE html>

<html dir="rtl" lang="he">

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

        ${CLASSIC_PACKAGES_ROWS_CSS}

        ${RECENT_PHOTOS_GRID_CSS}

        ${CLASSIC_RECENT_PHOTOS_HEADER_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${classicFaqSectionCss(primaryColor)}

        ${HERO_SLIDESHOW_CSS}

        ${sectionBgCss}

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

<h1 class="font-display-lg text-3xl md:text-4xl lg:text-5xl mb-2 md:mb-2 lg:mb-6 leading-tight text-white whitespace-normal break-words">${photographerName || 'אפרת כהן'} | צילום</h1>

<p class="font-body-lg text-body-lg text-white/90 mb-0 lg:mb-8 leading-relaxed whitespace-normal break-words">${aboutTextHtml || 'תופסים את הקסם שקורה בין הרגעים, בסטייל קלאסי ומרגש.'}</p>

</div>

<div class="hero-glass-actions">

<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="flex-1 bg-primary text-on-primary px-lg md:px-xl py-2.5 md:py-md rounded-none font-label-sm text-label-sm hover:brightness-110 hover:-translate-y-1 transition-all shadow-lg active:scale-95 whitespace-nowrap">

                        תיאום פגישה

                    </button>

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="flex-1 border border-white/30 text-white px-lg md:px-xl py-2.5 md:py-md rounded-none font-label-sm text-label-sm hover:bg-white/10 transition-all whitespace-nowrap">

                        לצפייה בגלריות

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

<span class="about-section-label block">About — קצת עליי</span>

${aboutTitle ? `<h2 class="about-title">${underlineLastWord(aboutTitle)}</h2>` : `<h2 class="about-title">${underlineLastWord('אודות הסטודיו')}</h2>`}

<div class="space-y-6">

${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}

</div>

${hasStats ? `

<div class="grid grid-cols-3 gap-md md:gap-lg border-t border-outline-variant/15 pt-10 mt-4">

<div class="text-right">

<div class="about-stat-number">${formatStat(statsClients)}</div>

<div class="about-stat-label">לקוחות מרוצים</div>

</div>

<div class="text-right">

<div class="about-stat-number">${formatStat(statsProjects)}</div>

<div class="about-stat-label">תיקי עבודות</div>

</div>

<div class="text-right">

<div class="about-stat-number">${formatStat(statsYears)}</div>

<div class="about-stat-label">שנות ניסיון</div>

</div>

</div>

` : ''}

</div>

<div class="order-2 relative">

${about_image_url ? `<img alt="דיוקן צלמת" class="w-full aspect-[4/5] md:aspect-[3/4] object-cover" src="${about_image_url}"/>` : ''}

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

<section class="homepage-gallery-section bg-surface-container-low py-xxl reveal" id="galleries">

<div class="homepage-gallery-header px-lg mb-xl">

<div class="text-right">

<h2 class="font-headline-md text-headline-md text-on-surface">עבודות נבחרות</h2>

<p class="font-body-md text-body-md text-on-surface-variant mt-sm">מבט אל הרגעים שהפכו לנצח</p>

</div>

</div>

<div class="homepage-gallery-grid">

${generateUnifiedGalleryGridHTML(galleries, 'classic')}

</div>

</section>

` : ''}

${galleries.some((g) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header">

<div class="hp-posts-header hp-posts-header--with-more hp-posts-header--classic stagger-reveal" data-reveal-delay="0">

<div class="hp-posts-header__titles">

<span class="hp-posts-eyebrow" style="color:${primaryColor};">רגעים נבחרים מהעבודות שלנו</span>

<h2 class="hp-posts-title" style="font-family:'Frank Ruhl Libre', serif;color:#1c1917;">תמונות אחרונות</h2>

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

<div class="grid grid-cols-1 lg:grid-cols-12 gap-xl md:gap-xxl items-start lg:gap-xl lg:gap-xxl">

<div class="lg:col-span-5 space-y-lg">

<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block">צרו קשר</span>

<h2 class="font-headline-md text-headline-md text-on-surface">בואו ניצור זיכרונות יחד</h2>

<p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">השאירו פרטים ואחזור אליכם בהקדם לתיאום פגישת היכרות נעימה, שבה נתכנן את הצילומים המושלמים עבורכם.</p>

<div class="space-y-md pt-lg">

${studioPhone ? `
<a class="flex items-center gap-md flex-row-reverse justify-end group transition-colors hover:text-primary" href="tel:${studioPhoneHref}">

<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">call</span>

<span class="font-body-md text-body-md" dir="ltr">${studioPhoneHtml}</span>

</a>` : ''}

<a class="flex items-center gap-md flex-row-reverse justify-end group transition-colors hover:text-primary" href="mailto:${email || 'hello@studiogallery.co.il'}">

<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">mail</span>

<span class="font-body-md text-body-md">${email || 'hello@studiogallery.co.il'}</span>

</a>

${studioAddress ? `

<div class="flex items-center gap-md flex-row-reverse justify-end">

<span class="material-symbols-outlined text-primary">location_on</span>

<span class="font-body-md text-body-md">${studioAddressHtml}</span>

</div>` : ''}

</div>

</div>

<div class="lg:col-span-7">

<form class="${hasContactBg ? 'bg-surface/50 backdrop-blur-sm' : 'bg-surface'} p-xl lg:p-xxl rounded-sm shadow-xl border border-outline-variant/20 stagger-item">

<div class="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">

<div class="space-y-xs">

<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">שם מלא</label>

<input name="name" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="ישראל ישראלי" required="" type="text"/>

</div>

<div class="space-y-xs">

<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">טלפון ליצירת קשר</label>

<input name="phone" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="050-0000000" type="tel"/>

</div>

</div>

<div class="space-y-xs mb-lg">

<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">כתובת אימייל</label>

<input name="email" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="example@email.com" required="" type="email"/>

</div>

<div class="space-y-xs mb-xl">

<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">ספרו לי על האירוע שלכם</label>

<textarea name="message" class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 ${hasContactBg ? 'bg-transparent' : 'bg-surface'} px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 resize-none px-md" placeholder="איזה סוג צילומים אתם מחפשים?" required="" rows="4"></textarea>

</div>

${generateContactPrivacyConsentHTML('classic', primaryColor, 'mb-lg')}

<button class="w-full bg-primary text-on-primary py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-md" type="submit">

                        שלח פנייה

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

        

        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };

        const observer = new IntersectionObserver((entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add('active');

                }

            });

        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => { observer.observe(el); });

        window.addEventListener('load', () => {

            document.querySelectorAll('.reveal').forEach(el => {

                const rect = el.getBoundingClientRect();

                if (rect.top < window.innerHeight) {

                    el.classList.add('active');

                }

            });

        });



    </script>

<script>${HERO_SLIDESHOW_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_EQUAL_HEIGHT_SCRIPT}</script>

<script>${TESTIMONIALS_MARQUEE_INIT_SCRIPT}</script>

<script>${TESTIMONIALS_CAROUSEL_INIT_SCRIPT}</script>

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId)}</script>

</body>

</html>

  `;



  // DARK THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA

  const DarkTheme = () => `

<!DOCTYPE html>

<html class="dark" dir="rtl" lang="he">

<head>

<meta charset="utf-8"/>

<meta content="width=device-width, initial-scale=1.0" name="viewport"/>

${documentHead}

<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Space+Grotesk:wght@300;700;800&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>

<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<style>

        :root {

            --headline-font: 'Space Grotesk', sans-serif;

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

        .about-title {

            font-family: 'Frank Ruhl Libre', serif;

            font-size: clamp(2.5rem, 5vw, 4.5rem);

            line-height: 1.05;

            font-weight: 400;

            font-style: italic;

            color: #F5F5F0;

        }

        .about-title-underline {

            border-bottom: 2px solid ${primaryColor};

            padding-bottom: 4px;

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

        .bold-nav .bold-nav-logo {

            transition: filter 0.7s ease;

        }

        .bold-nav:not(.nav-scrolled) .bold-nav-logo {

            filter: brightness(0) invert(1);

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

        .bold-nav.nav-scrolled .bold-nav-logo {

            filter: ${photographer.should_color_logo ? 'none' : 'brightness(0) invert(1)'};

        }

        .bold-nav .bold-nav-brand .text-primary {

            color: ${primaryColor};

        }

        .modern-section-subtitle {

            color: ${primaryColor};

        }

        .bold-hero-image {

            opacity: 0.72;

            filter: grayscale(10%) brightness(1.14) contrast(1.04);

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

            padding: 1.5rem 1.5rem 3rem 1.5rem;

            text-align: right;

        }

        .bold-hero-label {

            font-family: 'Heebo', sans-serif;

            font-size: 13px;

            letter-spacing: 0.3em;

            text-transform: uppercase;

            color: ${primaryColor};

        }

        .bold-hero-title {

            font-size: clamp(2.25rem, 5.5vw, 4.25rem);

            line-height: 1.05;

            font-weight: 800;

            letter-spacing: -0.02em;

        }

        .bold-hero-title .text-primary {

            color: ${primaryColor};

        }

        .bold-hero-actions {

            display: flex;

            flex-direction: column;

            align-items: flex-start;

            gap: 1.5rem;

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

                padding: 2rem 2.5rem 4rem 1.5rem;

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

        ${RECENT_PHOTOS_GRID_CSS}

        ${HOMEPAGE_STAGGER_REVEAL_CSS}

        ${TESTIMONIAL_THUMB_CARD_CSS}

        ${FAQ_ACCORDION_CSS}

        ${MODERN_FAQ_ACCORDION_CSS}

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

<span class="bold-hero-label mb-lg block">Premium Studio</span>

<h1 class="bold-hero-title text-on-surface mb-md">

                    ${brandLastWord(studioName)}

                </h1>

<p class="font-body-md text-body-md max-w-xl mb-xl text-on-surface-variant leading-relaxed whitespace-pre-line">

                    ${aboutTextHtml}

                </p>

<div class="bold-hero-actions flex flex-col sm:flex-row gap-lg">

<button onclick="document.querySelector('${heroGalleryAnchor}').scrollIntoView({behavior: 'smooth'})" class="bold-hero-btn-gallery border border-primary text-primary bg-transparent py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary hover:text-on-primary whitespace-nowrap">

                        צפו בגלריה

                    </button>

<button onclick="document.querySelector('#about').scrollIntoView({behavior: 'smooth'})" class="text-on-surface font-label-sm uppercase tracking-widest border-b border-on-surface/30 hover:border-primary btn-fuchsia-transition py-xs">

                        הסיפור שלנו

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

${about_image_url ? `<img alt="דיוקן צלמת" class="w-full aspect-[4/5] object-cover" src="${about_image_url}"/>` : ''}

<div class="about-image-quote absolute -bottom-10 -right-6 md:-right-12 max-w-[260px] hidden md:block">

<div class="about-image-quote-line"></div>

<p class="about-image-quote-name">— ${photographerName}</p>

</div>

</div>

<div class="lg:col-span-7 max-w-2xl">

<span class="about-section-label block mb-6">About · קצת עליי</span>

${aboutTitle ? `<h2 class="about-title mb-8">${underlineLastWord(aboutTitle)}</h2>` : '<h2 class="about-title mb-8">החזון שלנו הוא לתעד רגעים שחיים לנצח</h2>'}

<div class="space-y-5">

${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}

${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}

</div>

${hasStats ? `

<div class="grid grid-cols-3 gap-lg pt-12 mt-4 max-w-xl">

<div class="text-right">

<div class="about-stat-number">${formatStat(statsClients)}</div>

<div class="about-stat-label">לקוחות מרוצים</div>

</div>

<div class="text-right">

<div class="about-stat-number">${formatStat(statsProjects)}</div>

<div class="about-stat-label">תיקי עבודות</div>

</div>

<div class="text-right">

<div class="about-stat-number">${formatStat(statsYears)}</div>

<div class="about-stat-label">שנות ניסיון</div>

</div>

</div>

` : ''}

</div>

</div>

</div>

</section>

` : ''}

${!isPortfolioMode ? `

<section class="homepage-gallery-section py-xl md:py-xxl reveal" id="gallery">

<div class="homepage-gallery-header px-lg mb-lg md:mb-xxl text-right">

<div>

<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Portfolio</span>

<h2 class="font-headline-md text-headline-md">תיק עבודות נבחר</h2>

</div>

</div>

<div class="homepage-gallery-grid">

${generateUnifiedGalleryGridHTML(galleries, 'dark')}

</div>

</section>

` : ''}

${galleries.some((g) => (g.photo_pool?.length ?? 0) > 0) ? `

<section class="recent-photos-section" id="recent-photos">

<div class="recent-photos-header text-right">

<div class="flex flex-row-reverse justify-between items-end">

<div>

<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Latest</span>

<h2 class="font-headline-md text-headline-md">תמונות אחרונות</h2>

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

<section class="py-xl md:py-xxl reveal relative overflow-hidden w-full" id="pricing">

${aboutAmbientBackgroundHtml}

<div class="container mx-auto px-lg relative z-10">

<div class="text-center mb-xl md:mb-xxl max-w-2xl mx-auto stagger-reveal" data-reveal-delay="0">

<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Investment</span>

<h2 class="font-headline-md text-headline-md mb-md text-on-surface">${escapeHtml(packagesSectionCopy.title)}</h2>

<p class="text-on-surface-variant font-body-md">${escapeHtml(packagesSectionCopy.subtitle)}</p>

</div>

<div class="${packagesGridClass}">${generatePackagesHTML('dark')}</div>

</div>

</section>

` : ''}

${hasTestimonials ? `

<section class="testimonials-section py-xl md:py-xxl container mx-auto px-lg reveal" id="testimonials">

<div class="text-center mb-xl md:mb-xxl">

<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">Kind Words</span>

<h2 class="font-headline-md text-headline-md">${escapeHtml(testimonialsSectionTitle)}</h2>

</div>

<div class="testimonials-section-grid">${generateTestimonialsSection('dark')}</div>

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

<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">Join the Studio</span>

<h2 class="font-headline-md text-headline-md mb-md">בואו ניצור משהו בלתי נשכח</h2>

<p class="font-body-md mb-xl text-on-surface-variant max-w-xl mx-auto opacity-70">השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או צילומים.</p>

<form class="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-2xl mx-auto text-right">

<div class="border-b border-outline-variant">

<input name="name" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="שם מלא" required="" type="text"/>

</div>

<div class="border-b border-outline-variant">

<input name="email" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="כתובת אימייל" required="" type="email"/>

</div>

<div class="border-b border-outline-variant">

<input name="phone" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="טלפון" type="tel"/>

</div>

<div class="border-b border-outline-variant">

<input name="subject" class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="נושא" type="text"/>

</div>

<div class="md:col-span-2 border-b border-outline-variant">

<textarea name="message" required class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 min-h-[120px]" placeholder="ההודעה שלך"></textarea>

</div>

${generateContactPrivacyConsentHTML('dark', primaryColor, 'md:col-span-2')}

<div class="md:col-span-2 flex justify-center mt-md">

<button type="submit" class="bg-primary text-on-primary px-xxl py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary/90 active:scale-95">

            שלח הודעה

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

<script>

        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };

        const observer = new IntersectionObserver((entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add('active');

                }

            });

        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => { observer.observe(el); });

        window.addEventListener('load', () => {

            document.querySelectorAll('.reveal').forEach(el => {

                const rect = el.getBoundingClientRect();

                if (rect.top < window.innerHeight) {

                    el.classList.add('active');

                }

            });

        });

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

<script>${RECENT_PHOTOS_REVEAL_SCRIPT}</script>

<script>${HOMEPAGE_STAGGER_REVEAL_SCRIPT}</script>

${sectionScrollScript ? `<script>${sectionScrollScript}</script>\n` : ''}<script>${contactFormSubmitScript(photographerId)}</script>

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

