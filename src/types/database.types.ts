export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
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
        Relationships: [
          {
            foreignKeyName: 'biometrics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'exercises_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
          {
            foreignKeyName: 'training_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settings: {
        Row: {
          bar_weight: number;
          created_at: string;
          id: string;
          timer_secs: number;
          user_id: string;
          height: number | null;
          birth_year: number | null;
          biological_sex: string | null;
          experience_level: string | null;
          primary_goal: string | null;
          training_days_per_week: number | null;
          injuries_notes: string | null;
          gym_equipment: string | null;
          garmin_connected: boolean | null;
          onboarding_completed: boolean | null;
        };
        Insert: {
          bar_weight?: number;
          created_at?: string;
          id?: string;
          timer_secs?: number;
          user_id: string;
          height?: number | null;
          birth_year?: number | null;
          biological_sex?: string | null;
          experience_level?: string | null;
          primary_goal?: string | null;
          training_days_per_week?: number | null;
          injuries_notes?: string | null;
          gym_equipment?: string | null;
          garmin_connected?: boolean | null;
          onboarding_completed?: boolean | null;
        };
        Update: {
          bar_weight?: number;
          created_at?: string;
          id?: string;
          timer_secs?: number;
          user_id?: string;
          height?: number | null;
          birth_year?: number | null;
          biological_sex?: string | null;
          experience_level?: string | null;
          primary_goal?: string | null;
          training_days_per_week?: number | null;
          injuries_notes?: string | null;
          gym_equipment?: string | null;
          garmin_connected?: boolean | null;
          onboarding_completed?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'workout_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
}
