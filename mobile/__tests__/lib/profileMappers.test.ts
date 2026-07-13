import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mapUserSettingsRow, mapUserSettingsToRow } from '../../src/lib/profileMappers';

describe('mapUserSettingsRow', () => {
  it('maps timer_secs to recovery_timer', () => {
    const result = mapUserSettingsRow({
      timer_secs: 120,
      bar_weight: 20,
      onboarding_completed: true,
    });

    expect(result.recovery_timer).toBe(120);
    expect(result.bar_weight).toBe(20);
    expect(result.onboarding_completed).toBe(true);
  });
});

describe('mapUserSettingsToRow', () => {
  it('maps recovery_timer to timer_secs', () => {
    expect(mapUserSettingsToRow({ recovery_timer: 90 })).toEqual({ timer_secs: 90 });
  });

  it('includes only defined fields', () => {
    expect(
      mapUserSettingsToRow({
        garmin_connected: true,
        primary_goal: 'Forza',
      }),
    ).toEqual({
      garmin_connected: true,
      primary_goal: 'Forza',
    });
  });

  it('maps onboarding and profile fields', () => {
    expect(
      mapUserSettingsToRow({
        height: 180,
        birth_year: 1990,
        biological_sex: 'M',
        experience_level: 'intermediate',
        training_days_per_week: 4,
        injuries_notes: 'Nessuna',
        gym_equipment: 'Full',
        onboarding_completed: true,
      }),
    ).toEqual({
      height: 180,
      birth_year: 1990,
      biological_sex: 'M',
      experience_level: 'intermediate',
      training_days_per_week: 4,
      injuries_notes: 'Nessuna',
      gym_equipment: 'Full',
      onboarding_completed: true,
    });
  });
});
