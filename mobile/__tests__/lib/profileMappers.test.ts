import { describe, expect, it } from 'vitest';

import { mapUserSettingsRow, mapUserSettingsToRow } from '../../src/lib/profileMappers';

describe('profileMappers full', () => {
  it('mapUserSettingsRow mappa tutti i campi', () => {
    const mapped = mapUserSettingsRow({
      timer_secs: 90,
      bar_weight: 15,
      height: 180,
      birth_year: 1990,
      biological_sex: 'M',
      experience_level: 'intermedio',
      primary_goal: 'forza',
      training_days_per_week: 4,
      injuries_notes: 'ginocchio',
      gym_equipment: 'rack',
      garmin_connected: null,
      onboarding_completed: true,
    });
    expect(mapped).toMatchObject({
      recovery_timer: 90,
      bar_weight: 15,
      height: 180,
      garmin_connected: false,
      onboarding_completed: true,
    });
  });

  it('mapUserSettingsToRow omette undefined e mappa recovery_timer', () => {
    expect(mapUserSettingsToRow({})).toEqual({});
    expect(
      mapUserSettingsToRow({
        recovery_timer: 60,
        bar_weight: 20,
        height: null,
        birth_year: 1995,
        biological_sex: 'F',
        experience_level: 'beginner',
        primary_goal: 'cut',
        training_days_per_week: 3,
        injuries_notes: '',
        gym_equipment: 'dumbbells',
        garmin_connected: false,
        onboarding_completed: false,
      }),
    ).toEqual({
      timer_secs: 60,
      bar_weight: 20,
      height: null,
      birth_year: 1995,
      biological_sex: 'F',
      experience_level: 'beginner',
      primary_goal: 'cut',
      training_days_per_week: 3,
      injuries_notes: '',
      gym_equipment: 'dumbbells',
      garmin_connected: false,
      onboarding_completed: false,
    });
  });
});
