import { supabase } from '../lib/supabase';

export interface PersonalRecord {
  weight: number;
  reps: number;
  e1rm: number;
}

export interface DailyVolume {
  day: string;
  total_volume: number;
}

export interface SessionSummary {
  total_volume: number;
  sets_count: number;
  duration_mins: number | null;
}

export const analyticsService = {
  async getPersonalRecord(exerciseId: string): Promise<PersonalRecord | null> {
    const { data, error } = await supabase.rpc('get_personal_record', {
      p_exercise_id: exerciseId,
    });

    if (error || !data?.length) return null;
    const row = data[0] as { weight: number; reps: number; e1rm: number };
    return { weight: row.weight, reps: row.reps, e1rm: row.e1rm };
  },

  async getWeeklyVolume(days = 7): Promise<DailyVolume[]> {
    const { data, error } = await supabase.rpc('get_weekly_volume', { p_days: days });

    if (error || !data) return [];
    return (data as DailyVolume[]).map((row) => ({
      day: String(row.day),
      total_volume: Number(row.total_volume),
    }));
  },

  async getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
    const { data, error } = await supabase.rpc('get_session_summary', {
      p_session_id: sessionId,
    });

    if (error || !data) return null;
    const summary = data as unknown as SessionSummary;
    return {
      total_volume: Number(summary.total_volume ?? 0),
      sets_count: Number(summary.sets_count ?? 0),
      duration_mins: summary.duration_mins != null ? Number(summary.duration_mins) : null,
    };
  },
};
