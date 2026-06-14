export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GalleryStatus =
  | 'draft'
  | 'sent'
  | 'selection'
  | 'editing'
  | 'delivery_ready'
  | 'locked'

export type GalleryType = 'selection' | 'delivery' | 'portfolio'

export type DownloadJobType = 'preview' | 'original' | 'edited'

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
          logo_url: string | null
          theme_primary: string
          theme_secondary: string
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          studio_name?: string | null
          logo_url?: string | null
          theme_primary?: string
          theme_secondary?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          studio_name?: string | null
          logo_url?: string | null
          theme_primary?: string
          theme_secondary?: string
          created_at?: string
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
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          original_url?: string | null
          preview_url?: string | null
          watermarked_preview_url?: string | null
          is_visible_to_client?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          original_url?: string | null
          preview_url?: string | null
          watermarked_preview_url?: string | null
          is_visible_to_client?: boolean
          sort_order?: number
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
          created_at: string
        }
        Insert: {
          id?: string
          type: FeedbackType
          name: string
          email: string
          message: string
          studio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: FeedbackType
          name?: string
          email?: string
          message?: string
          studio?: string | null
          created_at?: string
        }
        Relationships: []
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

export type GalleryWithSettings = Gallery & {
  gallery_settings: GallerySettings | null
}

export type GalleryWithPhotos = Gallery & {
  photos: Photo[]
}

export type PhotoWithSelection = Photo & {
  photo_selections: PhotoSelection | null
}
