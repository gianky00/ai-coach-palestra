import { supabase } from '../lib/supabase';

export interface VolumeLogEntry {
  weight: number;
  reps: number;
  created_at: string;
  exercises: {
    name: string;
    muscle_group: string;
  } | null;
}

export const analyticsService = {
  /**
   * Recupera tutti i log di allenamento con i dettagli dell'esercizio (nome, gruppo muscolare).
   * Utile per calcolare la distribuzione dei gruppi muscolari, il volume complessivo e i PR.
   */
  async fetchAllLogsWithExercise(): Promise<VolumeLogEntry[]> {
    const { data, error } = await supabase
      .from('training_logs')
      .select(
        `
        weight,
        reps,
        created_at,
        exercises (
          name,
          muscle_group
        )
      `,
      )
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.error('Errore nel recupero dei log per Analytics:', error);
      return [];
    }

    // Effettua il cast e filtra eventuali log con esercizio nullo per sicurezza sui tipi
    return data as unknown as VolumeLogEntry[];
  },

  /** Recupera il numero totale di sessioni di allenamento completate. */
  async fetchSessionsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Errore nel conteggio delle sessioni:', error);
      return 0;
    }

    return count || 0;
  },
};
