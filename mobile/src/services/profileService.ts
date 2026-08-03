import { mapUserSettingsRow, mapUserSettingsToRow, type UserSettings } from '../lib/profileMappers';
import { supabase } from '../lib/supabase';

export type { UserSettings } from '../lib/profileMappers';

interface BiometricEntry {
  weight: number;
  created_at: string;
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

    if (error || !data) return null;
    return mapUserSettingsRow(data);
  },

  /** Recupera l'ultima misurazione peso corporeo. */
  async fetchLatestWeight(): Promise<number | null> {
    const { data, error } = await supabase
      .from('biometrics')
      .select('weight')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data.weight;
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
    return await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        ...mapUserSettingsToRow(settings),
      },
      { onConflict: 'user_id' },
    );
  },
};
