/**
 * Supabase schema — keep in sync with your project tables.
 * @see AGENTS.md § Supabase
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'client' | 'platform_admin' | string

export type UsersRow = {
  id: string
  auth_id: string | null
  email: string | null
  role: UserRole | null
  access_code: string | null
  created_at: string
}

export type PhotographersRow = {
  id: string
  auth_user_id: string
  display_name: string | null
  email: string | null
  slug: string
  subscription_status: string
  created_at: string
}

export type ClientsRow = {
  id: string
  user_id: string
  photographer_id: string
  full_name: string | null
  phone: string | null
  created_at: string
}

export type AlbumStatus = 'draft' | 'active' | 'expired' | string

export type AlbumsRow = {
  id: string
  client_id: string
  photographer_id: string
  title: string | null
  cover_image: string | null
  access_token: string | null
  expires_at: string | null
  status: AlbumStatus | null
  is_public: boolean | null
  max_album_selections: number | null
  max_edit_selections: number | null
  selections_submitted_at: string | null
  created_at: string
}

export type ImageStatus = 'pending' | 'ready' | 'deleting' | string

export type ImagesRow = {
  id: string
  album_id: string
  image_url: string | null
  thumbnail_url: string | null
  /** סיומת קובץ מקור ב-R2 (jpg, png…) — לבניית URL דינמי */
  original_ext: string | null
  /** pending = לפני העלאה; ready = זמינה ללקוח; deleting = מחיקה ברקע */
  status: ImageStatus | null
  created_at: string
}

export type SelectionType = 'album' | 'edit' | 'favorite' | 'print' | 'download' | string

export type ImageSelectionsRow = {
  id: string
  image_id: string
  client_id: string
  selection_type: SelectionType | null
  created_at: string
}

export type DownloadLogsRow = {
  id: string
  image_id: string
  client_id: string
  downloaded_at: string
}

export type PackagesRow = {
  id: string
  photographer_id: string
  title: string | null
  price: number | null
  description: string | null
  features: string[] | null
  is_featured: boolean | null
  is_active: boolean | null
  sort_order: number | null
  created_at: string
}

export type TestimonialStatus = 'pending' | 'approved' | 'rejected'

export type TestimonialsRow = {
  id: string
  client_id: string
  content: string
  status: TestimonialStatus
  created_at: string
  reviewed_at: string | null
}

export type PlatformAdminAuthRow = {
  email: string
  password_hash: string
  updated_at: string
}

export type PasswordResetTokenRow = {
  id: string
  email: string
  token_hash: string
  scope: 'platform' | 'client'
  photographer_id: string | null
  expires_at: string
  used_at: string | null
  created_at: string
}

export type SiteSettingsRow = {
  id: string
  photographer_id: string
  business_name: string | null
  tagline: string | null
  about_text: string | null
  about_headline_line1: string | null
  about_headline_line2: string | null
  about_quote: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  years_experience: number | null
  total_clients: number | null
  total_projects: number | null
  primary_color: string | null
  secondary_color: string | null
  hero_image_url: string | null
  hero_image_url_mobile: string | null
  about_image_url: string | null
  logo_url: string | null
  theme_style: string | null
}

type Tables = {
  photographers: {
    Row: PhotographersRow
    Insert: {
      id?: string
      auth_user_id: string
      display_name?: string | null
      email?: string | null
      slug?: string
      subscription_status?: string
      created_at?: string
    }
    Update: Partial<PhotographersRow>
    Relationships: []
  }
  users: {
    Row: UsersRow
    Insert: {
      id?: string
      auth_id?: string | null
      email?: string | null
      role?: UserRole | null
      access_code?: string | null
      created_at?: string
    }
    Update: Partial<UsersRow>
    Relationships: []
  }
  clients: {
    Row: ClientsRow
    Insert: {
      id?: string
      user_id: string
      photographer_id: string
      full_name?: string | null
      phone?: string | null
      created_at?: string
    }
    Update: Partial<ClientsRow>
    Relationships: []
  }
  albums: {
    Row: AlbumsRow
    Insert: {
      id?: string
      client_id: string
      photographer_id: string
      title?: string | null
      cover_image?: string | null
      access_token?: string | null
      expires_at?: string | null
      status?: AlbumStatus | null
      is_public?: boolean | null
      max_album_selections?: number | null
      max_edit_selections?: number | null
      selections_submitted_at?: string | null
      created_at?: string
    }
    Update: Partial<AlbumsRow>
    Relationships: []
  }
  images: {
    Row: ImagesRow
    Insert: {
      id?: string
      album_id: string
      image_url?: string | null
      thumbnail_url?: string | null
      original_ext?: string | null
      status?: ImageStatus | null
      created_at?: string
    }
    Update: Partial<ImagesRow>
    Relationships: []
  }
  image_selections: {
    Row: ImageSelectionsRow
    Insert: {
      id?: string
      image_id: string
      client_id: string
      selection_type?: SelectionType | null
      created_at?: string
    }
    Update: Partial<ImageSelectionsRow>
    Relationships: []
  }
  download_logs: {
    Row: DownloadLogsRow
    Insert: {
      id?: string
      image_id: string
      client_id: string
      downloaded_at?: string
    }
    Update: Partial<DownloadLogsRow>
    Relationships: []
  }
  packages: {
    Row: PackagesRow
    Insert: {
      id?: string
      photographer_id: string
      title?: string | null
      price?: number | null
      description?: string | null
      features?: string[] | null
      is_featured?: boolean | null
      is_active?: boolean | null
      sort_order?: number | null
      created_at?: string
    }
    Update: Partial<PackagesRow>
    Relationships: []
  }
  testimonials: {
    Row: TestimonialsRow
    Insert: {
      id?: string
      client_id: string
      content: string
      status?: TestimonialStatus
      created_at?: string
      reviewed_at?: string | null
    }
    Update: Partial<TestimonialsRow>
    Relationships: []
  }
  platform_admin_auth: {
    Row: PlatformAdminAuthRow
    Insert: {
      email: string
      password_hash: string
      updated_at?: string
    }
    Update: Partial<PlatformAdminAuthRow>
    Relationships: []
  }
  password_reset_tokens: {
    Row: PasswordResetTokenRow
    Insert: {
      id?: string
      email: string
      token_hash: string
      scope: 'platform' | 'client'
      photographer_id?: string | null
      expires_at: string
      used_at?: string | null
      created_at?: string
    }
    Update: Partial<PasswordResetTokenRow>
    Relationships: []
  }
  site_settings: {
    Row: SiteSettingsRow
    Insert: {
      id?: string
      photographer_id: string
      business_name?: string | null
      tagline?: string | null
      about_text?: string | null
      about_headline_line1?: string | null
      about_headline_line2?: string | null
      about_quote?: string | null
      phone?: string | null
      email?: string | null
      whatsapp?: string | null
      years_experience?: number | null
      total_clients?: number | null
      total_projects?: number | null
      primary_color?: string | null
      secondary_color?: string | null
      hero_image_url?: string | null
      hero_image_url_mobile?: string | null
      about_image_url?: string | null
      logo_url?: string | null
      theme_style?: string | null
    }
    Update: Partial<SiteSettingsRow>
    Relationships: []
  }
}

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: Tables
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
