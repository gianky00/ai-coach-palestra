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

export type UserSettingsRow = {
  timer_secs: number;
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
};

/** Mappa una riga DB user_settings nel tipo applicativo. */
export const mapUserSettingsRow = (data: UserSettingsRow): UserSettings => ({
  recovery_timer: data.timer_secs,
  bar_weight: data.bar_weight,
  height: data.height,
  birth_year: data.birth_year,
  biological_sex: data.biological_sex,
  experience_level: data.experience_level,
  primary_goal: data.primary_goal,
  training_days_per_week: data.training_days_per_week,
  injuries_notes: data.injuries_notes,
  gym_equipment: data.gym_equipment,
  garmin_connected: data.garmin_connected,
  onboarding_completed: data.onboarding_completed,
});

/** Mappa impostazioni applicative nel payload upsert Supabase. */
export const mapUserSettingsToRow = (settings: Partial<UserSettings>) => ({
  ...(settings.recovery_timer !== undefined && { timer_secs: settings.recovery_timer }),
  ...(settings.bar_weight !== undefined && { bar_weight: settings.bar_weight }),
  ...(settings.height !== undefined && { height: settings.height }),
  ...(settings.birth_year !== undefined && { birth_year: settings.birth_year }),
  ...(settings.biological_sex !== undefined && { biological_sex: settings.biological_sex }),
  ...(settings.experience_level !== undefined && {
    experience_level: settings.experience_level,
  }),
  ...(settings.primary_goal !== undefined && { primary_goal: settings.primary_goal }),
  ...(settings.training_days_per_week !== undefined && {
    training_days_per_week: settings.training_days_per_week,
  }),
  ...(settings.injuries_notes !== undefined && { injuries_notes: settings.injuries_notes }),
  ...(settings.gym_equipment !== undefined && { gym_equipment: settings.gym_equipment }),
  ...(settings.garmin_connected !== undefined && {
    garmin_connected: settings.garmin_connected,
  }),
  ...(settings.onboarding_completed !== undefined && {
    onboarding_completed: settings.onboarding_completed,
  }),
});
