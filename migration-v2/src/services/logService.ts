import { supabase } from '../lib/supabase';

export const logService = {
  async fetchTodayLogsForExercise(exerciseId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await supabase
      .from('training_logs')
      .select('*')
      .eq('exercise_id', exerciseId)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: true });
  },

  async fetchTodayTotalLogs() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await supabase
      .from('training_logs')
      .select('exercise_id, weight, reps')
      .gte('created_at', startOfDay.toISOString());
  },

  async deleteLog(id: string) {
    return await supabase.from('training_logs').delete().eq('id', id);
  },

  async fetchWeeklyVolumeByMuscle() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return await supabase
      .from('training_logs')
      .select('weight, reps, exercises!inner(muscle_group)')
      .gte('created_at', sevenDaysAgo.toISOString());
  },

  async fetchPersonalRecord(exerciseId: string) {
    return await supabase
      .from('training_logs')
      .select('weight, reps')
      .eq('exercise_id', exerciseId)
      .order('weight', { ascending: false })
      .order('reps', { ascending: false })
      .limit(1)
      .maybeSingle();
  },

  async fetchLastSessionLog(exerciseId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return await supabase
      .from('training_logs')
      .select('weight, reps, created_at')
      .eq('exercise_id', exerciseId)
      .lt('created_at', startOfToday.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  },
};
