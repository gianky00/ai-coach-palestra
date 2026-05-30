import { supabase } from '../lib/supabase';

interface BiometricEntry {
  weight: number;
  created_at: string;
}

export interface UserSettings {
  recovery_timer: number;
  bar_weight: number;
  height?: number | null;
  birth_year?: number | null;
  biological_sex?: string | null;
  experience_level?: string | null;
  primary_goal?: string | null;
  training_days_per_week?: number | null;
  injuries_notes?: string | null;
  gym_equipment?: string | null;
  garmin_connected?: boolean | null;
  onboarding_completed?: boolean | null;
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
  async saveSettings(userId: string, settings: Partial<UserSettings>) {
    return await supabase.from('user_settings').upsert({
      user_id: userId,
      ...(settings.recovery_timer !== undefined && { timer_secs: settings.recovery_timer }),
      ...(settings.bar_weight !== undefined && { bar_weight: settings.bar_weight }),
      ...(settings.height !== undefined && { height: settings.height }),
      ...(settings.birth_year !== undefined && { birth_year: settings.birth_year }),
      ...(settings.biological_sex !== undefined && { biological_sex: settings.biological_sex }),
      ...(settings.experience_level !== undefined && { experience_level: settings.experience_level }),
      ...(settings.primary_goal !== undefined && { primary_goal: settings.primary_goal }),
      ...(settings.training_days_per_week !== undefined && { training_days_per_week: settings.training_days_per_week }),
      ...(settings.injuries_notes !== undefined && { injuries_notes: settings.injuries_notes }),
      ...(settings.gym_equipment !== undefined && { gym_equipment: settings.gym_equipment }),
      ...(settings.garmin_connected !== undefined && { garmin_connected: settings.garmin_connected }),
      ...(settings.onboarding_completed !== undefined && { onboarding_completed: settings.onboarding_completed }),
    });
  },
};
