import { supabase } from '../lib/supabase';
import { DAYS } from '../lib/utils';

export const exerciseService = {
  async fetchTodayExercises(userId: string) {
    const oggi = DAYS[new Date().getDay()];
    return await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .eq('training_day', oggi)
      .order('order_index', { ascending: true });
  },

  async addExercise(userId: string, name: string, group: string) {
    return await supabase.from('exercises').insert([
      {
        user_id: userId,
        name,
        muscle_group: group || 'Varie',
        training_day: DAYS[new Date().getDay()],
        target_reps: '10',
        target_sets: 3,
        notes: 'PALESTRA',
      },
    ]);
  },
};
