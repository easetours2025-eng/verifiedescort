export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_super_admin: boolean | null
          password_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_super_admin?: boolean | null
          password_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_super_admin?: boolean | null
          password_hash?: string
        }
        Relationships: []
      }
      admin_video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
          user_ip: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
          user_ip?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
          user_ip?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "admin_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_video_views: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
          user_ip: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
          user_ip?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
          user_ip?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "admin_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_videos: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          file_path: string
          id: string
          is_active: boolean
          thumbnail_path: string | null
          title: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_path: string
          id?: string
          is_active?: boolean
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_path?: string
          id?: string
          is_active?: boolean
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      celebrity_media: {
        Row: {
          celebrity_id: string
          description: string | null
          file_path: string
          file_type: string
          id: string
          is_premium: boolean | null
          is_public: boolean | null
          price: number | null
          title: string | null
          upload_date: string
        }
        Insert: {
          celebrity_id: string
          description?: string | null
          file_path: string
          file_type: string
          id?: string
          is_premium?: boolean | null
          is_public?: boolean | null
          price?: number | null
          title?: string | null
          upload_date?: string
        }
        Update: {
          celebrity_id?: string
          description?: string | null
          file_path?: string
          file_type?: string
          id?: string
          is_premium?: boolean | null
          is_public?: boolean | null
          price?: number | null
          title?: string | null
          upload_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebrity_media_celebrity_id_fkey"
            columns: ["celebrity_id"]
            isOneToOne: false
            referencedRelation: "celebrity_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_celebrity_media_celebrity_id"
            columns: ["celebrity_id"]
            isOneToOne: false
            referencedRelation: "celebrity_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      celebrity_profiles: {
        Row: {
          age: number | null
          base_price: number
          bio: string | null
          created_at: string
          credit_balance: number | null
          date_of_birth: string | null
          email: string | null
          gender: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_special_offer_active: boolean | null
          is_verified: boolean | null
          location: string | null
          phone_number: string | null
          profile_picture_path: string | null
          real_name: string | null
          social_instagram: string | null
          social_tiktok: string | null
          social_twitter: string | null
          special_offer_registered_at: string | null
          stage_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          base_price?: number
          bio?: string | null
          created_at?: string
          credit_balance?: number | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_special_offer_active?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          phone_number?: string | null
          profile_picture_path?: string | null
          real_name?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          special_offer_registered_at?: string | null
          stage_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          base_price?: number
          bio?: string | null
          created_at?: string
          credit_balance?: number | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_special_offer_active?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          phone_number?: string | null
          profile_picture_path?: string | null
          real_name?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          special_offer_registered_at?: string | null
          stage_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      celebrity_services: {
        Row: {
          celebrity_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          price: number | null
          service_name: string
          updated_at: string
        }
        Insert: {
          celebrity_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          service_name: string
          updated_at?: string
        }
        Update: {
          celebrity_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          service_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      celebrity_subscriptions: {
        Row: {
          amount_paid: number | null
          celebrity_id: string
          created_at: string
          duration_type: string | null
          id: string
          is_active: boolean
          last_payment_id: string | null
          subscription_end: string | null
          subscription_start: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          celebrity_id: string
          created_at?: string
          duration_type?: string | null
          id?: string
          is_active?: boolean
          last_payment_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          celebrity_id?: string
          created_at?: string
          duration_type?: string | null
          id?: string
          is_active?: boolean
          last_payment_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebrity_subscriptions_last_payment_id_fkey"
            columns: ["last_payment_id"]
            isOneToOne: false
            referencedRelation: "payment_verification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_celebrity_subscriptions_celebrity_id"
            columns: ["celebrity_id"]
            isOneToOne: false
            referencedRelation: "celebrity_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          celebrity_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          celebrity_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          celebrity_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversations_celebrity_id"
            columns: ["celebrity_id"]
            isOneToOne: false
            referencedRelation: "celebrity_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_likes: {
        Row: {
          created_at: string
          id: string
          like_type: string
          media_id: string
          user_id: string | null
          user_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          like_type?: string
          media_id: string
          user_id?: string | null
          user_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          like_type?: string
          media_id?: string
          user_id?: string | null
          user_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_likes_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "celebrity_media"
            referencedColumns: ["id"]
          },
        ]
      }
      media_views: {
        Row: {
          created_at: string
          id: string
          media_id: string
          user_id: string | null
          user_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          user_id?: string | null
          user_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          user_id?: string | null
          user_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_views_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "celebrity_media"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_verification: {
        Row: {
          amount: number
          celebrity_id: string
          created_at: string
          credit_balance: number | null
          duration_type: string | null
          expected_amount: number | null
          expires_at: string
          id: string
          is_verified: boolean
          mpesa_code: string
          payment_date: string
          payment_status: string | null
          phone_number: string
          subscription_tier: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          celebrity_id: string
          created_at?: string
          credit_balance?: number | null
          duration_type?: string | null
          expected_amount?: number | null
          expires_at?: string
          id?: string
          is_verified?: boolean
          mpesa_code: string
          payment_date?: string
          payment_status?: string | null
          phone_number: string
          subscription_tier?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          celebrity_id?: string
          created_at?: string
          credit_balance?: number | null
          duration_type?: string | null
          expected_amount?: number | null
          expires_at?: string
          id?: string
          is_verified?: boolean
          mpesa_code?: string
          payment_date?: string
          payment_status?: string | null
          phone_number?: string
          subscription_tier?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_verification_celebrity_id"
            columns: ["celebrity_id"]
            isOneToOne: false
            referencedRelation: "celebrity_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_packages: {
        Row: {
          created_at: string
          display_order: number
          duration_type: string
          features: Json
          id: string
          is_active: boolean
          price: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          duration_type: string
          features?: Json
          id?: string
          is_active?: boolean
          price: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          duration_type?: string
          features?: Json
          id?: string
          is_active?: boolean
          price?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_ip: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_ip: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_ip?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "celebrity_media"
            referencedColumns: ["id"]
          },
        ]
      }
      video_views: {
        Row: {
          created_at: string
          id: string
          user_ip: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_ip?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_ip?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "celebrity_media"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_celebrity_sensitive_data: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      get_admin_video_like_count: {
        Args: { video_uuid: string }
        Returns: number
      }
      get_admin_video_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          video_id: string
          view_count: number
          view_date: string
        }[]
      }
      get_media_like_count: {
        Args: { media_uuid: string }
        Returns: number
      }
      get_media_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          media_id: string
          view_count: number
          view_date: string
        }[]
      }
      get_non_admin_celebrities: {
        Args: Record<PropertyKey, never>
        Returns: {
          age: number
          base_price: number
          bio: string
          created_at: string
          date_of_birth: string
          email: string
          gender: string
          hourly_rate: number
          id: string
          is_available: boolean
          is_special_offer_active: boolean
          is_verified: boolean
          location: string
          phone_number: string
          profile_picture_path: string
          real_name: string
          social_instagram: string
          social_tiktok: string
          social_twitter: string
          special_offer_registered_at: string
          stage_name: string
          updated_at: string
          user_id: string
        }[]
      }
      get_payment_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          pending_amount: number
          pending_payments: number
          total_amount: number
          total_payments: number
          verified_amount: number
          verified_payments: number
        }[]
      }
      get_public_celebrity_data: {
        Args: { celebrity_profile_id?: string }
        Returns: {
          age: number
          base_price: number
          bio: string
          created_at: string
          gender: string
          hourly_rate: number
          id: string
          is_available: boolean
          is_verified: boolean
          location: string
          profile_picture_path: string
          social_instagram: string
          social_tiktok: string
          social_twitter: string
          stage_name: string
          updated_at: string
        }[]
      }
      get_public_celebrity_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          age: number
          base_price: number
          bio: string
          created_at: string
          gender: string
          hourly_rate: number
          id: string
          is_available: boolean
          is_verified: boolean
          location: string
          profile_picture_path: string
          social_instagram: string
          social_tiktok: string
          social_twitter: string
          stage_name: string
          updated_at: string
        }[]
      }
      get_safe_celebrity_profiles: {
        Args: { celebrity_id?: string }
        Returns: {
          age: number
          base_price: number
          bio: string
          created_at: string
          gender: string
          hourly_rate: number
          id: string
          is_available: boolean
          is_verified: boolean
          location: string
          profile_picture_path: string
          social_instagram: string
          social_tiktok: string
          social_twitter: string
          stage_name: string
        }[]
      }
      get_video_like_count: {
        Args: { video_uuid: string }
        Returns: number
      }
      get_video_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          video_id: string
          view_count: number
          view_date: string
        }[]
      }
      has_user_liked_admin_video: {
        Args: { user_ip_param: string; video_uuid: string }
        Returns: boolean
      }
      has_user_liked_media: {
        Args: { media_uuid: string; user_ip_param: string }
        Returns: boolean
      }
      has_user_liked_video: {
        Args: { user_ip_param: string; video_uuid: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_request: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_celebrity_subscription_active: {
        Args: { celebrity_profile_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_in_grace_period: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_special_offer_active: {
        Args: {
          profile_created_at: string
          special_offer_registered_at: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
