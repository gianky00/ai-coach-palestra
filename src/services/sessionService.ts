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
        training_logs (weight, reps)
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
    return await supabase
      .from('workout_sessions')
      .select('*')
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
  },

  async startWorkout(userId: string) {
    return await supabase
      .from('workout_sessions')
      .insert([{ user_id: userId, start_time: new Date().toISOString() }])
      .select()
      .single();
  },

  async endWorkout(sessionId: string, endTime: string = new Date().toISOString()) {
    return await supabase
      .from('workout_sessions')
      .update({ end_time: endTime })
      .eq('id', sessionId);
  },
};
