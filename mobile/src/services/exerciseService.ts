import { supabase } from '../lib/supabase';
import { DAYS } from '../lib/utils';

export const exerciseService = {
  async fetchTodayExercises(userId: string) {
    const oggi = DAYS[new Date().getDay()];
    return this.fetchExercisesByDay(userId, oggi);
  },

  async fetchExercisesByDay(userId: string, day: string) {
    return await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .eq('training_day', day)
      .order('order_index', { ascending: true });
  },

  async addExercise(userId: string, name: string, group: string, day?: string) {
    const targetDay = day || DAYS[new Date().getDay()];
    return await supabase.from('exercises').insert([
      {
        user_id: userId,
        name,
        muscle_group: group || 'Varie',
        training_day: targetDay,
        target_reps: '10',
        target_sets: 3,
        notes: 'PALESTRA',
      },
    ]);
  },

  async updateExercise(
    exerciseId: string,
    updates: {
      name?: string;
      muscle_group?: string;
      training_day?: string;
      target_reps?: string;
      target_sets?: number;
      rest_time?: number;
    },
  ) {
    return await supabase.from('exercises').update(updates).eq('id', exerciseId);
  },

  async deleteExercise(exerciseId: string) {
    return await supabase.from('exercises').delete().eq('id', exerciseId);
  },

  async reorderExercise(exerciseId: string, userId: string, day: string, direction: 'up' | 'down') {
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('id, order_index')
      .eq('user_id', userId)
      .eq('training_day', day)
      .order('order_index', { ascending: true });

    if (error || !exercises?.length) return { error };

    const sorted = exercises.map((ex, i) => ({
      ...ex,
      order_index: ex.order_index ?? i,
    }));

    const currentIndex = sorted.findIndex((ex) => ex.id === exerciseId);
    if (currentIndex === -1) return { error: new Error('Esercizio non trovato') };

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return { error: null };

    const current = sorted[currentIndex];
    const target = sorted[targetIndex];

    const { error: err1 } = await supabase
      .from('exercises')
      .update({ order_index: target.order_index })
      .eq('id', current.id);

    if (err1) return { error: err1 };

    const { error: err2 } = await supabase
      .from('exercises')
      .update({ order_index: current.order_index })
      .eq('id', target.id);

    return { error: err2 };
  },

  async reorderExercises(orderedIds: string[]) {
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('exercises').update({ order_index: index }).eq('id', id),
      ),
    );
    const failed = results.find((r) => r.error);
    return { error: failed?.error ?? null };
  },
};
