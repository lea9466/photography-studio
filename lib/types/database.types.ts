export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GalleryStatus =
  | 'draft'
  | 'public'
  | 'selection'
  | 'editing'
  | 'delivery_ready'
  | 'locked'

export type GalleryType = 'selection' | 'portfolio'

export type DownloadJobType = 'preview' | 'original' | 'edited' | 'watermarked'

export type DownloadJobStatus = 'pending' | 'processing' | 'ready' | 'failed'

export type FeedbackType = 'משוב' | 'תקלה' | 'פיצ׳ר' | 'אחר'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          studio_name: string | null
          slug: string | null
          logo_url: string | null
          theme_primary: string
          theme_secondary: string
          created_at: string
          about_text: string | null
          about_title: string | null
          about_subtitle: string | null
          about_description: string | null
          contact_card_title: string | null
          contact_card_description: string | null
          address: string | null
          phone: string | null
          stat_projects: number | null
          stat_clients: number | null
          stat_experience_years: number | null
          accent_color: string | null
          selected_theme: string | null
          hero_desktop_url: string | null
          hero_mobile_url: string | null
          hero_desktop_urls: string[]
          hero_mobile_urls: string[]
          about_image_url: string | null
          contact_desktop_url: string | null
          contact_mobile_url: string | null
          packages_desktop_url: string | null
          packages_mobile_url: string | null
          should_color_logo: boolean
          faq_items: Json
          trial_end_date: string
          referral_code: string | null
          referred_by_user_id: string | null
          has_triggered_referral_bonus: boolean
          show_referral_popup: boolean
          show_welcome_popup: boolean
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          studio_name?: string | null
          slug?: string | null
          logo_url?: string | null
          theme_primary?: string
          theme_secondary?: string
          created_at?: string
          about_text?: string | null
          about_title?: string | null
          about_subtitle?: string | null
          about_description?: string | null
          contact_card_title?: string | null
          contact_card_description?: string | null
          address?: string | null
          phone?: string | null
          stat_projects?: number | null
          stat_clients?: number | null
          stat_experience_years?: number | null
          accent_color?: string | null
          selected_theme?: string | null
          hero_desktop_url?: string | null
          hero_mobile_url?: string | null
          hero_desktop_urls?: string[]
          hero_mobile_urls?: string[]
          about_image_url?: string | null
          contact_desktop_url?: string | null
          contact_mobile_url?: string | null
          packages_desktop_url?: string | null
          packages_mobile_url?: string | null
          should_color_logo?: boolean
          faq_items?: Json
          trial_end_date?: string
          referral_code?: string | null
          referred_by_user_id?: string | null
          has_triggered_referral_bonus?: boolean
          show_referral_popup?: boolean
          show_welcome_popup?: boolean
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          studio_name?: string | null
          slug?: string | null
          logo_url?: string | null
          theme_primary?: string
          theme_secondary?: string
          created_at?: string
          about_text?: string | null
          about_title?: string | null
          about_subtitle?: string | null
          about_description?: string | null
          contact_card_title?: string | null
          contact_card_description?: string | null
          address?: string | null
          phone?: string | null
          stat_projects?: number | null
          stat_clients?: number | null
          stat_experience_years?: number | null
          accent_color?: string | null
          selected_theme?: string | null
          hero_desktop_url?: string | null
          hero_mobile_url?: string | null
          hero_desktop_urls?: string[]
          hero_mobile_urls?: string[]
          about_image_url?: string | null
          contact_desktop_url?: string | null
          contact_mobile_url?: string | null
          packages_desktop_url?: string | null
          packages_mobile_url?: string | null
          should_color_logo?: boolean
          faq_items?: Json
          trial_end_date?: string
          referral_code?: string | null
          referred_by_user_id?: string | null
          has_triggered_referral_bonus?: boolean
          show_referral_popup?: boolean
          show_welcome_popup?: boolean
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clients_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      galleries: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          title: string
          slug: string | null
          status: GalleryStatus
          gallery_type: GalleryType
          password: string | null
          expires_at: string | null
          is_public: boolean
          cover_image: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          title: string
          slug?: string | null
          status?: GalleryStatus
          gallery_type?: GalleryType
          password?: string | null
          expires_at?: string | null
          is_public?: boolean
          cover_image?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          title?: string
          slug?: string | null
          status?: GalleryStatus
          gallery_type?: GalleryType
          password?: string | null
          expires_at?: string | null
          is_public?: boolean
          cover_image?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'galleries_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'galleries_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      photos: {
        Row: {
          id: string
          gallery_id: string
          original_url: string | null
          preview_url: string | null
          watermarked_preview_url: string | null
          is_visible_to_client: boolean
          is_processed: boolean
          sort_order: number
          width: number | null
          height: number | null
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          original_url?: string | null
          preview_url?: string | null
          watermarked_preview_url?: string | null
          is_visible_to_client?: boolean
          is_processed?: boolean
          sort_order?: number
          width?: number | null
          height?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          original_url?: string | null
          preview_url?: string | null
          watermarked_preview_url?: string | null
          is_visible_to_client?: boolean
          is_processed?: boolean
          sort_order?: number
          width?: number | null
          height?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'photos_gallery_id_fkey'
            columns: ['gallery_id']
            isOneToOne: false
            referencedRelation: 'galleries'
            referencedColumns: ['id']
          },
        ]
      }
      photo_selections: {
        Row: {
          id: string
          photo_id: string
          gallery_id: string
          selected_album: boolean
          selected_edit: boolean
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          gallery_id: string
          selected_album?: boolean
          selected_edit?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          gallery_id?: string
          selected_album?: boolean
          selected_edit?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'photo_selections_photo_id_fkey'
            columns: ['photo_id']
            isOneToOne: false
            referencedRelation: 'photos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'photo_selections_gallery_id_fkey'
            columns: ['gallery_id']
            isOneToOne: false
            referencedRelation: 'galleries'
            referencedColumns: ['id']
          },
        ]
      }
      edited_photos: {
        Row: {
          id: string
          photo_id: string
          gallery_id: string
          final_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          gallery_id: string
          final_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          gallery_id?: string
          final_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'edited_photos_photo_id_fkey'
            columns: ['photo_id']
            isOneToOne: false
            referencedRelation: 'photos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'edited_photos_gallery_id_fkey'
            columns: ['gallery_id']
            isOneToOne: false
            referencedRelation: 'galleries'
            referencedColumns: ['id']
          },
        ]
      }
      download_jobs: {
        Row: {
          id: string
          gallery_id: string
          type: DownloadJobType
          status: DownloadJobStatus
          file_url: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          type: DownloadJobType
          status?: DownloadJobStatus
          file_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          type?: DownloadJobType
          status?: DownloadJobStatus
          file_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'download_jobs_gallery_id_fkey'
            columns: ['gallery_id']
            isOneToOne: false
            referencedRelation: 'galleries'
            referencedColumns: ['id']
          },
        ]
      }
      gallery_settings: {
        Row: {
          id: string
          gallery_id: string
          allow_download_preview: boolean
          allow_download_original: boolean
          max_album_selection: number | null
          max_edit_selection: number | null
          watermark_text: string | null
          watermark_position: string
          auto_apply_watermark: boolean
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          allow_download_preview?: boolean
          allow_download_original?: boolean
          max_album_selection?: number | null
          max_edit_selection?: number | null
          watermark_text?: string | null
          watermark_position?: string
          auto_apply_watermark?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          allow_download_preview?: boolean
          allow_download_original?: boolean
          max_album_selection?: number | null
          max_edit_selection?: number | null
          watermark_text?: string | null
          watermark_position?: string
          auto_apply_watermark?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gallery_settings_gallery_id_fkey'
            columns: ['gallery_id']
            isOneToOne: true
            referencedRelation: 'galleries'
            referencedColumns: ['id']
          },
        ]
      }
      feedback: {
        Row: {
          id: string
          type: FeedbackType
          name: string
          email: string
          message: string
          studio: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: FeedbackType
          name: string
          email: string
          message: string
          studio?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: FeedbackType
          name?: string
          email?: string
          message?: string
          studio?: string | null
          image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      slug_redirects: {
        Row: {
          id: number
          old_slug: string
          new_slug: string
          created_at: string
        }
        Insert: {
          id?: number
          old_slug: string
          new_slug: string
          created_at?: string
        }
        Update: {
          id?: number
          old_slug?: string
          new_slug?: string
          created_at?: string
        }
        Relationships: []
      }
      photography_packages: {
        Row: {
          id: string
          user_id: string
          name: string
          price_amount: number
          duration_text: string | null
          includes: string[]
          is_active: boolean
          is_featured: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          price_amount: number
          duration_text?: string | null
          includes?: string[]
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          price_amount?: number
          duration_text?: string | null
          includes?: string[]
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'photography_packages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      testimonials: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          shoot_type: string | null
          review_date: string | null
          created_at: string
          is_featured: boolean
          sort_order: number
          image_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          shoot_type?: string | null
          review_date?: string | null
          created_at?: string
          is_featured?: boolean
          sort_order?: number
          image_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          shoot_type?: string | null
          review_date?: string | null
          created_at?: string
          is_featured?: boolean
          sort_order?: number
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'testimonials_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Gallery = Database['public']['Tables']['galleries']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
export type PhotoSelection = Database['public']['Tables']['photo_selections']['Row']
export type EditedPhoto = Database['public']['Tables']['edited_photos']['Row']
export type DownloadJob = Database['public']['Tables']['download_jobs']['Row']
export type GallerySettings = Database['public']['Tables']['gallery_settings']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type SlugRedirect = Database['public']['Tables']['slug_redirects']['Row']
export type PhotographyPackage =
  Database['public']['Tables']['photography_packages']['Row']
export type Testimonial = Database['public']['Tables']['testimonials']['Row']

export type GalleryWithSettings = Gallery & {
  gallery_settings: GallerySettings | null
}

export type GalleryWithPhotos = Gallery & {
  photos: Photo[]
}

export type PhotoWithSelection = Photo & {
  photo_selections: PhotoSelection | null
}
