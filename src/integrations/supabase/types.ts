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
      direct_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          pair_key: string | null
          updated_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          pair_key?: string | null
          updated_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          pair_key?: string | null
          updated_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          pair_key: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          pair_key?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          pair_key?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      game_participants: {
        Row: {
          fingers_remaining: number
          game_id: string
          id: string
          is_eliminated: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          fingers_remaining?: number
          game_id: string
          id?: string
          is_eliminated?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          fingers_remaining?: number
          game_id?: string
          id?: string
          is_eliminated?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_rounds: {
        Row: {
          asked_by: string
          created_at: string
          game_id: string
          id: string
          participants_who_did: Json
          question_id: string
          round_number: number
        }
        Insert: {
          asked_by: string
          created_at?: string
          game_id: string
          id?: string
          participants_who_did?: Json
          question_id: string
          round_number: number
        }
        Update: {
          asked_by?: string
          created_at?: string
          game_id?: string
          id?: string
          participants_who_did?: Json
          question_id?: string
          round_number?: number
        }
        Relationships: []
      }
      group_conversations: {
        Row: {
          created_at: string
          group_id: string
          id: string
          last_message_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          admin_id: string
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      never_have_i_ever_games: {
        Row: {
          created_at: string
          current_player_turn: string | null
          current_question_id: string | null
          host_id: string
          id: string
          max_fingers: number
          party_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_player_turn?: string | null
          current_question_id?: string | null
          host_id: string
          id?: string
          max_fingers?: number
          party_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_player_turn?: string | null
          current_question_id?: string | null
          host_id?: string
          id?: string
          max_fingers?: number
          party_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "never_have_i_ever_games_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      never_have_i_ever_questions: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_custom: boolean
          question: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_custom?: boolean
          question: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_custom?: boolean
          question?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          created_at: string
          current_attendees: number | null
          description: string | null
          end_time: string | null
          group_id: string | null
          host_id: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          location_lat: number
          location_lng: number
          location_name: string
          max_attendees: number | null
          start_time: string
          title: string
          updated_at: string
          vibe: string | null
        }
        Insert: {
          created_at?: string
          current_attendees?: number | null
          description?: string | null
          end_time?: string | null
          group_id?: string | null
          host_id: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          location_lat: number
          location_lng: number
          location_name: string
          max_attendees?: number | null
          start_time: string
          title: string
          updated_at?: string
          vibe?: string | null
        }
        Update: {
          created_at?: string
          current_attendees?: number | null
          description?: string | null
          end_time?: string | null
          group_id?: string | null
          host_id?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          location_lat?: number
          location_lng?: number
          location_name?: string
          max_attendees?: number | null
          start_time?: string
          title?: string
          updated_at?: string
          vibe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_parties_host_id"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "parties_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      party_attendees: {
        Row: {
          created_at: string
          id: string
          party_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          party_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          party_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_party_attendees_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "party_attendees_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          interests: string[] | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          occupation: string | null
          phone_number: string | null
          profile_pictures: string[] | null
          university: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          occupation?: string | null
          phone_number?: string | null
          profile_pictures?: string[] | null
          university?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          occupation?: string | null
          phone_number?: string | null
          profile_pictures?: string[] | null
          university?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_friendship_pair_key: {
        Args: { user_a: string; user_b: string }
        Returns: string
      }
      get_game_participants: {
        Args: { p_game_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          fingers_remaining: number
          id: string
          is_eliminated: boolean
          user_id: string
          username: string
        }[]
      }
      is_conversation_participant: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      is_game_participant: {
        Args: { _game_id: string }
        Returns: boolean
      }
      is_game_participant_for_policy: {
        Args: { _game_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_conversation_participant: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      upsert_profile: {
        Args:
          | {
              p_age: number
              p_bio: string
              p_display_name: string
              p_interests: string[]
              p_location_lat: number
              p_location_lng: number
              p_location_name: string
              p_occupation: string
              p_phone_number: string
              p_university: string
              p_user_id: string
              p_username: string
            }
          | {
              p_age: number
              p_bio: string
              p_display_name: string
              p_interests: string[]
              p_location_lat: number
              p_location_lng: number
              p_location_name: string
              p_university: string
              p_user_id: string
              p_username: string
            }
        Returns: Json
      }
      upsert_profile_simple: {
        Args:
          | {
              p_age: number
              p_bio: string
              p_display_name: string
              p_interests: string[]
              p_location_lat: number
              p_location_lng: number
              p_location_name: string
              p_occupation: string
              p_phone_number: string
              p_profile_pictures?: string[]
              p_university: string
              p_username: string
            }
          | {
              p_age: number
              p_bio: string
              p_display_name: string
              p_interests: string[]
              p_location_lat: number
              p_location_lng: number
              p_location_name: string
              p_occupation: string
              p_phone_number: string
              p_university: string
              p_username: string
            }
        Returns: Json
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
