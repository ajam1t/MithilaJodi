/**
 * Database types — GENERATED. Do not hand-edit the Database type below.
 *
 * Regenerate after any schema change:
 *   supabase gen types typescript --project-id qhoebuzwmopivrujbnif --schema public  *     > apps/web/src/types/database.ts
 *   (then re-add the aliases at the bottom of this file)
 *
 * This previously covered only 14 of the 36 public tables, which is why so much
 * of the codebase reaches for `as any` — a query against an untyped table
 * returns GenericStringError rather than a row type, and the cast was the quick
 * way past it. Those casts are still there; they come out file by file. With the
 * full schema typed, new code no longer needs them.
 */

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_sessions: {
        Row: {
          account_id: string
          created_at: string
          device_hash: string | null
          expires_at: string
          id: string
          ip_address: unknown
          last_seen: string
          revoked_at: string | null
          token_hash: string
          user_agent: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          device_hash?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          last_seen?: string
          revoked_at?: string | null
          token_hash: string
          user_agent?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          device_hash?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_seen?: string
          revoked_at?: string | null
          token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_sessions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          deleted_at: string | null
          email: string | null
          email_verified: boolean
          failed_login_attempts: number
          id: string
          is_demo: boolean
          locked_until: string | null
          mobile: string
          mobile_verified: boolean
          password_hash: string | null
          password_reset_expires_at: string | null
          password_reset_token_hash: string | null
          role: Database["public"]["Enums"]["account_role"]
          status_reason: string | null
          updated_at: string
          whatsapp_opt_in: boolean
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          email_verified?: boolean
          failed_login_attempts?: number
          id?: string
          is_demo?: boolean
          locked_until?: string | null
          mobile: string
          mobile_verified?: boolean
          password_hash?: string | null
          password_reset_expires_at?: string | null
          password_reset_token_hash?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          status_reason?: string | null
          updated_at?: string
          whatsapp_opt_in?: boolean
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          email_verified?: boolean
          failed_login_attempts?: number
          id?: string
          is_demo?: boolean
          locked_until?: string | null
          mobile?: string
          mobile_verified?: boolean
          password_hash?: string | null
          password_reset_expires_at?: string | null
          password_reset_token_hash?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          status_reason?: string | null
          updated_at?: string
          whatsapp_opt_in?: boolean
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          ip_address: unknown
          payload: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: number
          ip_address?: unknown
          payload?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: number
          ip_address?: unknown
          payload?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      biodata_generations: {
        Row: {
          completed_at: string | null
          error_message: string | null
          expires_at: string | null
          fields_included: Json
          file_size_bytes: number | null
          generated_at: string
          id: string
          language: Database["public"]["Enums"]["biodata_language"]
          profile_id: string
          status: Database["public"]["Enums"]["biodata_generation_status"]
          storage_path: string | null
          template_id: number
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          fields_included?: Json
          file_size_bytes?: number | null
          generated_at?: string
          id?: string
          language: Database["public"]["Enums"]["biodata_language"]
          profile_id: string
          status?: Database["public"]["Enums"]["biodata_generation_status"]
          storage_path?: string | null
          template_id: number
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          fields_included?: Json
          file_size_bytes?: number | null
          generated_at?: string
          id?: string
          language?: Database["public"]["Enums"]["biodata_language"]
          profile_id?: string
          status?: Database["public"]["Enums"]["biodata_generation_status"]
          storage_path?: string | null
          template_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "biodata_generations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biodata_generations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "biodata_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      biodata_templates: {
        Row: {
          active: boolean
          id: number
          label_en: string
          label_hi: string | null
          label_mai: string | null
          preview_path: string | null
          renderer: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          id?: number
          label_en: string
          label_hi?: string | null
          label_mai?: string | null
          preview_path?: string | null
          renderer?: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          id?: number
          label_en?: string
          label_hi?: string | null
          label_mai?: string | null
          preview_path?: string | null
          renderer?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          reason: Database["public"]["Enums"]["block_reason"] | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          reason?: Database["public"]["Enums"]["block_reason"] | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          reason?: Database["public"]["Enums"]["block_reason"] | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          category_id: number
          content: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured: boolean
          id: string
          keywords: string[] | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category_id: number
          content?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          keywords?: string[] | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category_id?: number
          content?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          keywords?: string[] | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_masters: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          is_mithila: boolean
          label_en: string
          label_hi: string | null
          label_mai: string | null
          sort_order: number
          type: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          is_mithila?: boolean
          label_en: string
          label_hi?: string | null
          label_mai?: string | null
          sort_order?: number
          type: string
          value: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          is_mithila?: boolean
          label_en?: string
          label_hi?: string | null
          label_mai?: string | null
          sort_order?: number
          type?: string
          value?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          ip_address: string | null
          message: string
          mobile: string | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          ip_address?: string | null
          message: string
          mobile?: string | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          message?: string
          mobile?: string | null
          reason?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          profile_a: string
          profile_b: string
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_a: string
          profile_b: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_a?: string
          profile_b?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_profile_a_fkey"
            columns: ["profile_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_profile_b_fkey"
            columns: ["profile_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_flags: {
        Row: {
          account_id_a: string
          account_id_b: string
          created_at: string
          flagged_reason: string | null
          id: string
          reviewed: boolean
          reviewed_by: string | null
          similarity_score: number | null
        }
        Insert: {
          account_id_a: string
          account_id_b: string
          created_at?: string
          flagged_reason?: string | null
          id?: string
          reviewed?: boolean
          reviewed_by?: string | null
          similarity_score?: number | null
        }
        Update: {
          account_id_a?: string
          account_id_b?: string
          created_at?: string
          flagged_reason?: string | null
          id?: string
          reviewed?: boolean
          reviewed_by?: string | null
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_flags_account_id_a_fkey"
            columns: ["account_id_a"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_flags_account_id_b_fkey"
            columns: ["account_id_b"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      education_levels: {
        Row: {
          id: number
          is_active: boolean
          label_en: string
          label_hi: string | null
          label_mai: string | null
          sort_order: number
        }
        Insert: {
          id?: number
          is_active?: boolean
          label_en: string
          label_hi?: string | null
          label_mai?: string | null
          sort_order?: number
        }
        Update: {
          id?: number
          is_active?: boolean
          label_en?: string
          label_hi?: string | null
          label_mai?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      family_permissions: {
        Row: {
          accepted_at: string | null
          delegate_account_id: string | null
          delegate_mobile: string
          delegate_name: string | null
          id: string
          invited_at: string
          ownership_transfer: boolean
          permission_level: Database["public"]["Enums"]["profile_permission_level"]
          profile_id: string
          revoked_at: string | null
          transfer_completed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          delegate_account_id?: string | null
          delegate_mobile: string
          delegate_name?: string | null
          id?: string
          invited_at?: string
          ownership_transfer?: boolean
          permission_level?: Database["public"]["Enums"]["profile_permission_level"]
          profile_id: string
          revoked_at?: string | null
          transfer_completed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          delegate_account_id?: string | null
          delegate_mobile?: string
          delegate_name?: string | null
          id?: string
          invited_at?: string
          ownership_transfer?: boolean
          permission_level?: Database["public"]["Enums"]["profile_permission_level"]
          profile_id?: string
          revoked_at?: string | null
          transfer_completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_permissions_delegate_account_id_fkey"
            columns: ["delegate_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      india_locations: {
        Row: {
          created_at: string
          id: number
          is_mithila_region: boolean
          latitude: number | null
          level: Database["public"]["Enums"]["location_level"]
          longitude: number | null
          name_en: string
          name_hi: string | null
          name_mai: string | null
          parent_id: number | null
          pincode: string | null
          state_code: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_mithila_region?: boolean
          latitude?: number | null
          level: Database["public"]["Enums"]["location_level"]
          longitude?: number | null
          name_en: string
          name_hi?: string | null
          name_mai?: string | null
          parent_id?: number | null
          pincode?: string | null
          state_code?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_mithila_region?: boolean
          latitude?: number | null
          level?: Database["public"]["Enums"]["location_level"]
          longitude?: number | null
          name_en?: string
          name_hi?: string | null
          name_mai?: string | null
          parent_id?: number | null
          pincode?: string | null
          state_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "india_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "india_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          from_profile: string
          id: string
          message: string | null
          responded_at: string | null
          sent_at: string
          status: Database["public"]["Enums"]["interest_status"]
          to_profile: string
        }
        Insert: {
          from_profile: string
          id?: string
          message?: string | null
          responded_at?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["interest_status"]
          to_profile: string
        }
        Update: {
          from_profile?: string
          id?: string
          message?: string | null
          responded_at?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["interest_status"]
          to_profile?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_from_profile_fkey"
            columns: ["from_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interests_to_profile_fkey"
            columns: ["to_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_consents: {
        Row: {
          account_id: string
          consented: boolean
          created_at: string
          id: string
          ip_address: unknown
          type: Database["public"]["Enums"]["consent_type"]
          user_agent: string | null
          version: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          account_id: string
          consented: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          type: Database["public"]["Enums"]["consent_type"]
          user_agent?: string | null
          version: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          account_id?: string
          consented?: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          type?: Database["public"]["Enums"]["consent_type"]
          user_agent?: string | null
          version?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_consents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      math_challenges: {
        Row: {
          answer_hash: string
          attempts: number
          created_at: string
          expires_at: string
          id: string
          question: string
          session_key: string
          used: boolean
        }
        Insert: {
          answer_hash: string
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          question: string
          session_key: string
          used?: boolean
        }
        Update: {
          answer_hash?: string
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          question?: string
          session_key?: string
          used?: boolean
        }
        Relationships: []
      }
      memberships: {
        Row: {
          account_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          grace_until: string | null
          id: string
          interests_sent: number
          payment_id: string | null
          plan: string
          started_at: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          grace_until?: string | null
          id?: string
          interests_sent?: number
          payment_id?: string | null
          plan: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          grace_until?: string | null
          id?: string
          interests_sent?: number
          payment_id?: string | null
          plan?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plan_config"
            referencedColumns: ["plan"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          deleted_at: string | null
          id: string
          read_at: string | null
          sender_id: string
          sent_at: string
        }
        Insert: {
          body: string
          conversation_id: string
          deleted_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
          sent_at?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          deleted_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          account_id: string | null
          confidence: number | null
          created_at: string
          id: string
          notes: string | null
          profile_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          type: Database["public"]["Enums"]["moderation_flag_type"]
        }
        Insert: {
          account_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          profile_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          type: Database["public"]["Enums"]["moderation_flag_type"]
        }
        Update: {
          account_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          profile_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          type?: Database["public"]["Enums"]["moderation_flag_type"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_flags_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          account_id: string
          created_at: string
          id: string
          payload: Json
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_challenges: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          mobile: string
          otp_hash: string
          used: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          mobile: string
          otp_hash: string
          used?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          mobile?: string
          otp_hash?: string
          used?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_id: string
          amount_paise: number
          created_at: string
          currency: string
          failure_code: string | null
          failure_description: string | null
          gateway: string
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gateway_signature: string | null
          id: string
          idempotency_key: string
          membership_id: string | null
          plan: string
          raw_webhook: Json | null
          refund_id: string | null
          refunded_amount_paise: number | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount_paise: number
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_description?: string | null
          gateway?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          id?: string
          idempotency_key: string
          membership_id?: string | null
          plan: string
          raw_webhook?: Json | null
          refund_id?: string | null
          refunded_amount_paise?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount_paise?: number
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_description?: string | null
          gateway?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          id?: string
          idempotency_key?: string
          membership_id?: string | null
          plan?: string
          raw_webhook?: Json | null
          refund_id?: string | null
          refunded_amount_paise?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_membership_fk"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plan_config"
            referencedColumns: ["plan"]
          },
        ]
      }
      plan_config: {
        Row: {
          active: boolean
          can_message: boolean
          can_send_interest: boolean
          duration_days: number
          expiring_soon_days: number
          grace_days: number
          interest_limit: number | null
          label_en: string
          label_hi: string | null
          label_mai: string | null
          plan: string
          price_paise: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          can_message?: boolean
          can_send_interest?: boolean
          duration_days: number
          expiring_soon_days?: number
          grace_days?: number
          interest_limit?: number | null
          label_en: string
          label_hi?: string | null
          label_mai?: string | null
          plan: string
          price_paise: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          can_message?: boolean
          can_send_interest?: boolean
          duration_days?: number
          expiring_soon_days?: number
          grace_days?: number
          interest_limit?: number | null
          label_en?: string
          label_hi?: string | null
          label_mai?: string | null
          plan?: string
          price_paise?: number
          updated_at?: string
        }
        Relationships: []
      }
      professions: {
        Row: {
          category: string
          id: number
          is_active: boolean
          label_en: string
          label_hi: string | null
          label_mai: string | null
          sort_order: number
        }
        Insert: {
          category: string
          id?: number
          is_active?: boolean
          label_en: string
          label_hi?: string | null
          label_mai?: string | null
          sort_order?: number
        }
        Update: {
          category?: string
          id?: number
          is_active?: boolean
          label_en?: string
          label_hi?: string | null
          label_mai?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      profile_discoverable: {
        Row: {
          age: number
          caste: string | null
          current_district_id: number | null
          current_state_id: number | null
          diet: string | null
          education_level_id: number | null
          gender: Database["public"]["Enums"]["profile_gender"]
          job_state_id: number | null
          last_active: string | null
          maternal_gotra: string | null
          membership_active: boolean
          mool: string | null
          native_district_id: number | null
          native_state_id: number | null
          profession_id: number | null
          profile_id: string
          rebuilt_at: string
          search_vector: unknown
          self_gotra: string | null
          sub_caste: string | null
          verified: boolean
        }
        Insert: {
          age: number
          caste?: string | null
          current_district_id?: number | null
          current_state_id?: number | null
          diet?: string | null
          education_level_id?: number | null
          gender: Database["public"]["Enums"]["profile_gender"]
          job_state_id?: number | null
          last_active?: string | null
          maternal_gotra?: string | null
          membership_active?: boolean
          mool?: string | null
          native_district_id?: number | null
          native_state_id?: number | null
          profession_id?: number | null
          profile_id: string
          rebuilt_at?: string
          search_vector?: unknown
          self_gotra?: string | null
          sub_caste?: string | null
          verified?: boolean
        }
        Update: {
          age?: number
          caste?: string | null
          current_district_id?: number | null
          current_state_id?: number | null
          diet?: string | null
          education_level_id?: number | null
          gender?: Database["public"]["Enums"]["profile_gender"]
          job_state_id?: number | null
          last_active?: string | null
          maternal_gotra?: string | null
          membership_active?: boolean
          mool?: string | null
          native_district_id?: number | null
          native_state_id?: number | null
          profession_id?: number | null
          profile_id?: string
          rebuilt_at?: string
          search_vector?: unknown
          self_gotra?: string | null
          sub_caste?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profile_discoverable_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          blurhash: string | null
          created_at: string
          display_order: number
          height_px: number | null
          id: string
          is_primary: boolean
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          profile_id: string
          status: Database["public"]["Enums"]["photo_status"]
          storage_path: string
          width_px: number | null
        }
        Insert: {
          blurhash?: string | null
          created_at?: string
          display_order?: number
          height_px?: number | null
          id?: string
          is_primary?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          profile_id: string
          status?: Database["public"]["Enums"]["photo_status"]
          storage_path: string
          width_px?: number | null
        }
        Update: {
          blurhash?: string | null
          created_at?: string
          display_order?: number
          height_px?: number | null
          id?: string
          is_primary?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          profile_id?: string
          status?: Database["public"]["Enums"]["photo_status"]
          storage_path?: string
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_preferences: {
        Row: {
          pref_age_max: number | null
          pref_age_min: number | null
          pref_career: string | null
          pref_caste: string[] | null
          pref_children: string | null
          pref_diet: string[] | null
          pref_education: number[] | null
          pref_gender: Database["public"]["Enums"]["profile_gender"] | null
          pref_gotra_safe: boolean
          pref_living_arrangement: string | null
          pref_location: number[] | null
          pref_manglik: string | null
          pref_marital_status: string[] | null
          pref_marriage_timeline: string | null
          pref_notes: string | null
          pref_profession: string[] | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_career?: string | null
          pref_caste?: string[] | null
          pref_children?: string | null
          pref_diet?: string[] | null
          pref_education?: number[] | null
          pref_gender?: Database["public"]["Enums"]["profile_gender"] | null
          pref_gotra_safe?: boolean
          pref_living_arrangement?: string | null
          pref_location?: number[] | null
          pref_manglik?: string | null
          pref_marital_status?: string[] | null
          pref_marriage_timeline?: string | null
          pref_notes?: string | null
          pref_profession?: string[] | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_career?: string | null
          pref_caste?: string[] | null
          pref_children?: string | null
          pref_diet?: string[] | null
          pref_education?: number[] | null
          pref_gender?: Database["public"]["Enums"]["profile_gender"] | null
          pref_gotra_safe?: boolean
          pref_living_arrangement?: string | null
          pref_location?: number[] | null
          pref_manglik?: string | null
          pref_marital_status?: string[] | null
          pref_marriage_timeline?: string | null
          pref_notes?: string | null
          pref_profession?: string[] | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          address: string | null
          birth_place: string | null
          birth_time: string | null
          contact_email: string | null
          contact_mobile: string | null
          income_max_lpa: number | null
          income_min_lpa: number | null
          kundli_url: string | null
          mangalik: string | null
          nakshatra: string | null
          photo_visibility: string | null
          profile_id: string
          rashi: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_place?: string | null
          birth_time?: string | null
          contact_email?: string | null
          contact_mobile?: string | null
          income_max_lpa?: number | null
          income_min_lpa?: number | null
          kundli_url?: string | null
          mangalik?: string | null
          nakshatra?: string | null
          photo_visibility?: string | null
          profile_id: string
          rashi?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_place?: string | null
          birth_time?: string | null
          contact_email?: string | null
          contact_mobile?: string | null
          income_max_lpa?: number | null
          income_min_lpa?: number | null
          kundli_url?: string | null
          mangalik?: string | null
          nakshatra?: string | null
          photo_visibility?: string | null
          profile_id?: string
          rashi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about_me: string | null
          account_id: string
          activated_at: string | null
          caste: string | null
          created_at: string
          current_loc_id: number | null
          degree: string | null
          deleted_at: string | null
          diet: string | null
          discoverable: boolean
          dob: string
          drinking: string | null
          education_detail: string | null
          education_level_id: number | null
          employer: string | null
          employment_type: string | null
          experience_years: number | null
          family_about: string | null
          family_expectations: string | null
          family_introduction: string | null
          family_type: string | null
          family_values: string | null
          first_name: string
          gender: Database["public"]["Enums"]["profile_gender"]
          gram: string | null
          height_cm: number | null
          id: string
          industry: string | null
          institution: string | null
          is_demo: boolean
          job_loc_id: number | null
          job_title: string | null
          last_name: string | null
          managed_by: string | null
          marital_status: string | null
          marriage_timeline:
            | Database["public"]["Enums"]["marriage_timeline"]
            | null
          maternal_gotra: string | null
          mool: string | null
          mother_tongue: string | null
          native_place_id: number | null
          parents_info: string | null
          passing_year: number | null
          profession_detail: string | null
          profession_id: number | null
          profile_complete: number
          profile_for: Database["public"]["Enums"]["profile_for"]
          profile_status: Database["public"]["Enums"]["profile_status"]
          religion: string
          search_needs_rebuild: boolean
          self_gotra: string | null
          siblings_info: string | null
          smoking: string | null
          specialization: string | null
          status_reason: string | null
          sub_caste: string | null
          updated_at: string
          visibility: string
          work_type: string | null
        }
        Insert: {
          about_me?: string | null
          account_id: string
          activated_at?: string | null
          caste?: string | null
          created_at?: string
          current_loc_id?: number | null
          degree?: string | null
          deleted_at?: string | null
          diet?: string | null
          discoverable?: boolean
          dob: string
          drinking?: string | null
          education_detail?: string | null
          education_level_id?: number | null
          employer?: string | null
          employment_type?: string | null
          experience_years?: number | null
          family_about?: string | null
          family_expectations?: string | null
          family_introduction?: string | null
          family_type?: string | null
          family_values?: string | null
          first_name: string
          gender: Database["public"]["Enums"]["profile_gender"]
          gram?: string | null
          height_cm?: number | null
          id?: string
          industry?: string | null
          institution?: string | null
          is_demo?: boolean
          job_loc_id?: number | null
          job_title?: string | null
          last_name?: string | null
          managed_by?: string | null
          marital_status?: string | null
          marriage_timeline?:
            | Database["public"]["Enums"]["marriage_timeline"]
            | null
          maternal_gotra?: string | null
          mool?: string | null
          mother_tongue?: string | null
          native_place_id?: number | null
          parents_info?: string | null
          passing_year?: number | null
          profession_detail?: string | null
          profession_id?: number | null
          profile_complete?: number
          profile_for?: Database["public"]["Enums"]["profile_for"]
          profile_status?: Database["public"]["Enums"]["profile_status"]
          religion?: string
          search_needs_rebuild?: boolean
          self_gotra?: string | null
          siblings_info?: string | null
          smoking?: string | null
          specialization?: string | null
          status_reason?: string | null
          sub_caste?: string | null
          updated_at?: string
          visibility?: string
          work_type?: string | null
        }
        Update: {
          about_me?: string | null
          account_id?: string
          activated_at?: string | null
          caste?: string | null
          created_at?: string
          current_loc_id?: number | null
          degree?: string | null
          deleted_at?: string | null
          diet?: string | null
          discoverable?: boolean
          dob?: string
          drinking?: string | null
          education_detail?: string | null
          education_level_id?: number | null
          employer?: string | null
          employment_type?: string | null
          experience_years?: number | null
          family_about?: string | null
          family_expectations?: string | null
          family_introduction?: string | null
          family_type?: string | null
          family_values?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["profile_gender"]
          gram?: string | null
          height_cm?: number | null
          id?: string
          industry?: string | null
          institution?: string | null
          is_demo?: boolean
          job_loc_id?: number | null
          job_title?: string | null
          last_name?: string | null
          managed_by?: string | null
          marital_status?: string | null
          marriage_timeline?:
            | Database["public"]["Enums"]["marriage_timeline"]
            | null
          maternal_gotra?: string | null
          mool?: string | null
          mother_tongue?: string | null
          native_place_id?: number | null
          parents_info?: string | null
          passing_year?: number | null
          profession_detail?: string | null
          profession_id?: number | null
          profile_complete?: number
          profile_for?: Database["public"]["Enums"]["profile_for"]
          profile_status?: Database["public"]["Enums"]["profile_status"]
          religion?: string
          search_needs_rebuild?: boolean
          self_gotra?: string | null
          siblings_info?: string | null
          smoking?: string | null
          specialization?: string | null
          status_reason?: string | null
          sub_caste?: string | null
          updated_at?: string
          visibility?: string
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_loc_id_fkey"
            columns: ["current_loc_id"]
            isOneToOne: false
            referencedRelation: "india_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_job_loc_id_fkey"
            columns: ["job_loc_id"]
            isOneToOne: false
            referencedRelation: "india_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_native_place_id_fkey"
            columns: ["native_place_id"]
            isOneToOne: false
            referencedRelation: "india_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      public_showcase: {
        Row: {
          added_by: string | null
          created_at: string
          is_active: boolean
          profile_id: string
          sort_order: number
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          is_active?: boolean
          profile_id: string
          sort_order?: number
        }
        Update: {
          added_by?: string | null
          created_at?: string
          is_active?: boolean
          profile_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_showcase_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          actioned_at: string | null
          created_at: string
          id: string
          notes: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reported_id: string
          reporter_id: string
          review_notes: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          actioned_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reported_id: string
          reporter_id: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          actioned_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_id?: string
          reporter_id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          profile_id: string
          saved_at: string
          saved_id: string
        }
        Insert: {
          profile_id: string
          saved_at?: string
          saved_id: string
        }
        Update: {
          profile_id?: string
          saved_at?: string
          saved_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_saved_id_fkey"
            columns: ["saved_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          masked_id: string | null
          profile_id: string
          provider: string
          provider_ref: string | null
          review_notes: string | null
          reviewed_by: string | null
          revocation_reason: string | null
          revoked_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
          type: Database["public"]["Enums"]["verification_type"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          masked_id?: string | null
          profile_id: string
          provider?: string
          provider_ref?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          type: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          masked_id?: string | null
          profile_id?: string
          provider?: string
          provider_ref?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          type?: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_requests: {
        Row: {
          id: string
          owner_profile_id: string
          requested_at: string
          requester_profile_id: string
          responded_at: string | null
          revoked_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_profile_id: string
          requested_at?: string
          requester_profile_id: string
          responded_at?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_profile_id?: string
          requested_at?: string
          requester_profile_id?: string
          responded_at?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_requests_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_requests_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_profile: {
        Args: { min_level?: string; p_profile_id: string }
        Returns: boolean
      }
      current_account_id: { Args: never; Returns: string }
      is_admin_or_moderator: { Args: never; Returns: boolean }
      rebuild_profile_discoverable: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      refresh_membership_statuses: { Args: never; Returns: undefined }
    }
    Enums: {
      account_role: "user" | "moderator" | "admin"
      account_status:
        | "pending_verification"
        | "active"
        | "suspended"
        | "banned"
        | "deactivated"
        | "deleted"
      biodata_generation_status:
        | "pending"
        | "processing"
        | "ready"
        | "failed"
        | "expired"
      biodata_language: "en" | "hi" | "mai" | "sa"
      block_reason: "harassment" | "fake_profile" | "inappropriate" | "other"
      consent_type:
        | "terms"
        | "privacy"
        | "data_processing"
        | "marketing"
        | "third_party_sharing"
      conversation_status: "open" | "closed" | "blocked"
      interest_status: "sent" | "accepted" | "declined" | "withdrawn"
      location_level:
        | "country"
        | "state"
        | "district"
        | "city"
        | "town"
        | "village"
      marriage_timeline:
        | "within_3_months"
        | "within_6_months"
        | "within_1_year"
        | "within_2_years"
        | "no_rush"
      membership_status:
        | "pending"
        | "active"
        | "expiring_soon"
        | "grace"
        | "expired"
        | "cancelled"
        | "refunded"
        | "payment_failed"
      moderation_flag_type:
        | "duplicate_mobile"
        | "suspicious_photo"
        | "profile_spam"
        | "multiple_accounts"
        | "age_mismatch"
        | "manual"
      notification_type:
        | "interest_received"
        | "interest_accepted"
        | "interest_declined"
        | "new_message"
        | "profile_viewed"
        | "membership_expiring"
        | "membership_expired"
        | "photo_approved"
        | "photo_rejected"
        | "profile_approved"
        | "profile_rejected"
        | "system"
      payment_status:
        | "created"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
        | "partially_refunded"
      photo_status: "pending_moderation" | "approved" | "rejected" | "deleted"
      profile_for: "self" | "son" | "daughter" | "sibling" | "other"
      profile_gender: "male" | "female"
      profile_permission_level: "view" | "edit" | "full"
      profile_status:
        | "draft"
        | "pending_review"
        | "active"
        | "deactivated"
        | "deleted"
      report_reason:
        | "fake_profile"
        | "harassment"
        | "inappropriate_photo"
        | "spam"
        | "underage"
        | "fraud"
        | "other"
      report_status: "open" | "under_review" | "actioned" | "dismissed"
      verification_status:
        | "pending"
        | "verified"
        | "failed"
        | "expired"
        | "revoked"
      verification_type: "mobile" | "email" | "digilocker" | "manual_review"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_role: ["user", "moderator", "admin"],
      account_status: [
        "pending_verification",
        "active",
        "suspended",
        "banned",
        "deactivated",
        "deleted",
      ],
      biodata_generation_status: [
        "pending",
        "processing",
        "ready",
        "failed",
        "expired",
      ],
      biodata_language: ["en", "hi", "mai", "sa"],
      block_reason: ["harassment", "fake_profile", "inappropriate", "other"],
      consent_type: [
        "terms",
        "privacy",
        "data_processing",
        "marketing",
        "third_party_sharing",
      ],
      conversation_status: ["open", "closed", "blocked"],
      interest_status: ["sent", "accepted", "declined", "withdrawn"],
      location_level: [
        "country",
        "state",
        "district",
        "city",
        "town",
        "village",
      ],
      marriage_timeline: [
        "within_3_months",
        "within_6_months",
        "within_1_year",
        "within_2_years",
        "no_rush",
      ],
      membership_status: [
        "pending",
        "active",
        "expiring_soon",
        "grace",
        "expired",
        "cancelled",
        "refunded",
        "payment_failed",
      ],
      moderation_flag_type: [
        "duplicate_mobile",
        "suspicious_photo",
        "profile_spam",
        "multiple_accounts",
        "age_mismatch",
        "manual",
      ],
      notification_type: [
        "interest_received",
        "interest_accepted",
        "interest_declined",
        "new_message",
        "profile_viewed",
        "membership_expiring",
        "membership_expired",
        "photo_approved",
        "photo_rejected",
        "profile_approved",
        "profile_rejected",
        "system",
      ],
      payment_status: [
        "created",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      photo_status: ["pending_moderation", "approved", "rejected", "deleted"],
      profile_for: ["self", "son", "daughter", "sibling", "other"],
      profile_gender: ["male", "female"],
      profile_permission_level: ["view", "edit", "full"],
      profile_status: [
        "draft",
        "pending_review",
        "active",
        "deactivated",
        "deleted",
      ],
      report_reason: [
        "fake_profile",
        "harassment",
        "inappropriate_photo",
        "spam",
        "underage",
        "fraud",
        "other",
      ],
      report_status: ["open", "under_review", "actioned", "dismissed"],
      verification_status: [
        "pending",
        "verified",
        "failed",
        "expired",
        "revoked",
      ],
      verification_type: ["mobile", "email", "digilocker", "manual_review"],
    },
  },
} as const

/* ── Hand-written aliases ──────────────────────────────────────────────────
   Kept because application code imports them. Derived from the generated enums
   rather than restated, so a schema change cannot leave them stale. */

export type ConsentType = Database['public']['Enums']['consent_type']
export type ProfileFor = Database['public']['Enums']['profile_for']
export type ProfileGender = Database['public']['Enums']['profile_gender']
export type ProfileStatus = Database['public']['Enums']['profile_status']
export type MembershipStatus = Database['public']['Enums']['membership_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type InterestStatus = Database['public']['Enums']['interest_status']
