import { supabase } from '../lib/supabase';

interface BiometricEntry {
  weight: number;
  created_at: string;
}

interface UserSettings {
  recovery_timer: number;
  bar_weight: number;
}

export const profileService = {
  /** Recupera lo storico peso dell'utente. */
  async fetchWeightHistory(): Promise<BiometricEntry[]> {
    const { data, error } = await supabase
      .from('biometrics')
      .select('weight, created_at')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  },

  /** Recupera le impostazioni dell'utente. */
  async fetchUserSettings(): Promise<UserSettings | null> {
    const { data, error } = await supabase.from('user_settings').select('*').maybeSingle();

    if (error) return null;
    return data as UserSettings | null;
  },

  /** Salva una nuova misurazione peso. */
  async saveWeight(userId: string, weight: number) {
    return await supabase.from('biometrics').insert([
      {
        user_id: userId,
        weight,
      },
    ]);
  },

  /** Salva/aggiorna le impostazioni utente (upsert). */
  async saveSettings(userId: string, recoveryTimer: number, barWeight: number) {
    return await supabase.from('user_settings').upsert({
      user_id: userId,
      recovery_timer: recoveryTimer,
      bar_weight: barWeight,
    });
  },
};
