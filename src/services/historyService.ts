import { supabase } from '../lib/supabase';

export const historyService = {
  /** Recupera la lista esercizi unici per il dropdown di progressione. */
  async fetchExerciseOptions() {
    const { data, error } = await supabase.from('exercises').select('id, name').order('name');

    if (error || !data) return [];
    // Deduplica per nome
    return Array.from(new Map(data.map((item) => [item.name, item])).values());
  },

  /** Recupera la progressione di un esercizio (per nome) nel tempo. */
  async fetchExerciseProgression(exerciseName: string) {
    const { data, error } = await supabase
      .from('training_logs')
      .select('weight, reps, created_at, exercises!inner(name)')
      .eq('exercises.name', exerciseName)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  },
};
