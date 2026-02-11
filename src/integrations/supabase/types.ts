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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      sync_tasks: {
        Row: {
          id: string;
          local_id: string;
          user_id: string;
          title: string;
          description: string | null;
          priority: 'urgent' | 'important' | 'can-wait' | 'dispensable';
          status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
          due_date: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          estimated_minutes: number | null;
          actual_minutes: number | null;
          tags: string[] | null;
          ai_recommendation: string | null;
          ai_reason: string | null;
        };
        Insert: {
          id?: string;
          local_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          priority: 'urgent' | 'important' | 'can-wait' | 'dispensable';
          status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          estimated_minutes?: number | null;
          actual_minutes?: number | null;
          tags?: string[] | null;
          ai_recommendation?: string | null;
          ai_reason?: string | null;
        };
        Update: {
          id?: string;
          local_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          priority?: 'urgent' | 'important' | 'can-wait' | 'dispensable';
          status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          estimated_minutes?: number | null;
          actual_minutes?: number | null;
          tags?: string[] | null;
          ai_recommendation?: string | null;
          ai_reason?: string | null;
        };
      };
      sync_notes: {
        Row: {
          id: string;
          local_id: string;
          user_id: string;
          title: string;
          content: string | null;
          category: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          local_id: string;
          user_id: string;
          title: string;
          content?: string | null;
          category: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          local_id?: string;
          user_id?: string;
          title?: string;
          content?: string | null;
          category?: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_goals: {
        Row: {
          id: string;
          local_id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
          target_date: string | null;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          local_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
          target_date?: string | null;
          progress: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          local_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
          target_date?: string | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_queue: {
        Row: {
          id: string;
          user_id: string;
          entity_type: 'task' | 'note' | 'goal';
          entity_id: string;
          action: 'create' | 'update' | 'delete';
          data: Json | null;
          created_at: string;
          processed_at: string | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: 'task' | 'note' | 'goal';
          entity_id: string;
          action: 'create' | 'update' | 'delete';
          data?: Json | null;
          created_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: 'task' | 'note' | 'goal';
          entity_id?: string;
          action?: 'create' | 'update' | 'delete';
          data?: Json | null;
          created_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
      };
      sync_conflicts: {
        Row: {
          id: string;
          user_id: string;
          entity_type: 'task' | 'note' | 'goal';
          entity_id: string;
          local_data: Json;
          remote_data: Json;
          created_at: string;
          resolved_at: string | null;
          resolution: 'local' | 'remote' | 'merge' | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: 'task' | 'note' | 'goal';
          entity_id: string;
          local_data: Json;
          remote_data: Json;
          created_at?: string;
          resolved_at?: string | null;
          resolution?: 'local' | 'remote' | 'merge' | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: 'task' | 'note' | 'goal';
          entity_id?: string;
          local_data?: Json;
          remote_data?: Json;
          created_at?: string;
          resolved_at?: string | null;
          resolution?: 'local' | 'remote' | 'merge' | null;
        };
      };
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
