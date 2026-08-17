import type { FaqItem } from '@/lib/faq'

export interface Photographer {

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

  heading_font?: string | null

  about_title_font?: string | null

  hero_desktop_url: string | null

  hero_mobile_url: string | null

  hero_desktop_urls?: string[] | null

  hero_mobile_urls?: string[] | null

  hero_type?: 'images' | 'video' | null

  hero_video_url?: string | null

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

  galleries_title: string | null

  recent_photos_title: string | null

  email: string | null

  phone: string | null

  address: string | null

  faq_items?: FaqItem[] | unknown

  faq_section_image_url?: string | null

  should_color_logo?: boolean

  posts_page_title?: string | null

  posts_display_style?: string | null

  gallery_layout_mode?: string | null

  site_language?: string | null

}



export interface Gallery {

  id: string

  title: string

  slug: string | null

  preview_url: string | null

  created_at: string

  photographer_slug: string

  photo_pool?: string[] | null

}



export interface Package {

  id: string

  name: string

  price_amount: number

  duration_text: string | null

  includes: string[]

  sort_order: number

  is_featured: boolean

}



export interface Testimonial {

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


