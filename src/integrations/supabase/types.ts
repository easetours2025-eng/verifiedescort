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
          date_of_birth: string | null
          email: string | null
          gender: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          location: string | null
          phone_number: string | null
          profile_picture_path: string | null
          real_name: string | null
          social_instagram: string | null
          social_tiktok: string | null
          social_twitter: string | null
          stage_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          base_price?: number
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          phone_number?: string | null
          profile_picture_path?: string | null
          real_name?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          stage_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          base_price?: number
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          phone_number?: string | null
          profile_picture_path?: string | null
          real_name?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
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
          expires_at: string
          id: string
          is_verified: boolean
          mpesa_code: string
          payment_date: string
          phone_number: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          celebrity_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_verified?: boolean
          mpesa_code: string
          payment_date?: string
          phone_number: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          celebrity_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_verified?: boolean
          mpesa_code?: string
          payment_date?: string
          phone_number?: string
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_access: {
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
