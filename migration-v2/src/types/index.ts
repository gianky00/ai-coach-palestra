export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  target_reps: string;
  target_sets: number;
  training_day: string;
  notes?: string;
  completed?: boolean;
  last_weight?: number;
  is_pr?: boolean;
  sets_done?: number;
  rest_time?: number; // In secondi
}

export interface TrainingLog {
  id: string;
  exercise_id: string;
  session_id: string | null;
  weight: number;
  reps: number;
  rpe: number;
  set_type?: 'W' | 'S' | 'F'; // W: Warmup, S: Standard, F: Failure
  created_at?: string;
  tempId?: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
}

// --- History View Types ---
export interface SessionData {
  id: string;
  start_time: string;
  end_time: string;
  volume: number;
  ex_count: number;
}

export interface ExerciseOption {
  id: string;
  name: string;
}

export interface ProgressionData {
  date: string;
  e1rm: number;
  weight: number;
}

// --- Detail and Heatmap Types ---
export interface SessionLogDetail {
  weight: number;
  reps: number;
  rpe: number;
  set_type: string;
  created_at: string;
  exercises: {
    name: string;
    muscle_group: string;
  };
}

export interface WeeklyMuscleVolumeLog {
  weight: number;
  reps: number;
  exercises: {
    muscle_group: string;
  };
}

export interface OfflineLog {
  tempId: string;
  user_id: string;
  exercise_id: string;
  session_id: string | null;
  weight: number;
  reps: number;
  rpe: number;
  set_type?: 'W' | 'S' | 'F';
  created_at: string;
}
