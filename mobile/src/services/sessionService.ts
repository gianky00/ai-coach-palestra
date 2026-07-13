import { supabase } from '../lib/supabase';

export const sessionService = {
  async fetchSessionsWithStats() {
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select(
        `
        id, 
        start_time, 
        end_time,
        training_logs (weight, reps, exercises (name, muscle_group))
      `,
      )
      .order('start_time', { ascending: false });

    return sessions;
  },

  async deleteSession(sessionId: string) {
    return await supabase.from('workout_sessions').delete().eq('id', sessionId);
  },

  async fetchSessionDetails(sessionId: string) {
    return await supabase
      .from('training_logs')
      .select(
        `
        weight, 
        reps, 
        rpe, 
        set_type, 
        created_at,
        exercises (name, muscle_group)
      `,
      )
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
  },

  async fetchActiveSession() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await supabase
      .from('workout_sessions')
      .select('*')
      .is('end_time', null)
      .gte('start_time', today.toISOString())
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
  },
};
