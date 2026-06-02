export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      biometrics: {
        Row: {
          created_at: string;
          id: string;
          user_id: string;
          weight: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          user_id: string;
          weight: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id?: string;
          weight?: number;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          created_at: string;
          id: string;
          muscle_group: string;
          name: string;
          notes: string | null;
          order_index: number | null;
          rest_time: number | null;
          target_reps: string;
          target_sets: number;
          training_day: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          muscle_group: string;
          name: string;
          notes?: string | null;
          order_index?: number | null;
          rest_time?: number | null;
          target_reps: string;
          target_sets?: number;
          training_day: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          muscle_group?: string;
          name?: string;
          notes?: string | null;
          order_index?: number | null;
          rest_time?: number | null;
          target_reps?: string;
          target_sets?: number;
          training_day?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      training_logs: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          reps: number;
          rpe: number;
          session_id: string | null;
          set_type: string;
          user_id: string;
          weight: number;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          id?: string;
          reps: number;
          rpe: number;
          session_id?: string | null;
          set_type?: string;
          user_id: string;
          weight: number;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          reps?: number;
          rpe?: number;
          session_id?: string | null;
          set_type?: string;
          user_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'training_logs_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_logs_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'workout_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settings: {
        Row: {
          bar_weight: number;
          biological_sex: string | null;
          birth_year: number | null;
          created_at: string;
          experience_level: string | null;
          garmin_connected: boolean | null;
          gym_equipment: string | null;
          height: number | null;
          id: string;
          injuries_notes: string | null;
          onboarding_completed: boolean | null;
          primary_goal: string | null;
          timer_secs: number;
          training_days_per_week: number | null;
          user_id: string;
        };
        Insert: {
          bar_weight?: number;
          biological_sex?: string | null;
          birth_year?: number | null;
          created_at?: string;
          experience_level?: string | null;
          garmin_connected?: boolean | null;
          gym_equipment?: string | null;
          height?: number | null;
          id?: string;
          injuries_notes?: string | null;
          onboarding_completed?: boolean | null;
          primary_goal?: string | null;
          timer_secs?: number;
          training_days_per_week?: number | null;
          user_id: string;
        };
        Update: {
          bar_weight?: number;
          biological_sex?: string | null;
          birth_year?: number | null;
          created_at?: string;
          experience_level?: string | null;
          garmin_connected?: boolean | null;
          gym_equipment?: string | null;
          height?: number | null;
          id?: string;
          injuries_notes?: string | null;
          onboarding_completed?: boolean | null;
          primary_goal?: string | null;
          timer_secs?: number;
          training_days_per_week?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          end_time: string | null;
          id: string;
          start_time: string;
          user_id: string;
        };
        Insert: {
          end_time?: string | null;
          id?: string;
          start_time?: string;
          user_id: string;
        };
        Update: {
          end_time?: string | null;
          id?: string;
          start_time?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
