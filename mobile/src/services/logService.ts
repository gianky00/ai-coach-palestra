import { supabase } from '../lib/supabase';

export const logService = {
  async fetchLogsForExerciseByDate(exerciseId: string, targetDate: Date = new Date()) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await supabase
      .from('training_logs')
      .select('*')
      .eq('exercise_id', exerciseId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: true });
  },

  async fetchTotalLogsByDate(targetDate: Date = new Date()) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await supabase
      .from('training_logs')
      .select('exercise_id, weight, reps')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
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
      .select('weight, reps, created_at, exercises!inner(muscle_group)')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });
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
