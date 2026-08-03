import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSupabaseChain } from '../helpers/supabaseMock';

const { supabaseFrom } = vi.hoisted(() => ({
  supabaseFrom: vi.fn(),
}));

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: supabaseFrom },
}));

import { profileService } from '../../src/services/profileService';

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchWeightHistory returns empty array on error', async () => {
    const chain = createSupabaseChain({ data: null, error: { message: 'fail' } });
    chain.order.mockResolvedValue({ data: null, error: { message: 'fail' } });
    supabaseFrom.mockReturnValue(chain);

    const result = await profileService.fetchWeightHistory();
    expect(result).toEqual([]);
  });

  it('fetchWeightHistory returns data on success', async () => {
    const rows = [{ weight: 75, created_at: '2026-01-01' }];
    const chain = createSupabaseChain({ data: rows, error: null });
    chain.order.mockResolvedValue({ data: rows, error: null });
    supabaseFrom.mockReturnValue(chain);

    const result = await profileService.fetchWeightHistory();
    expect(result).toEqual(rows);
  });

  it('fetchUserSettings maps DB row', async () => {
    const chain = createSupabaseChain({
      data: { timer_secs: 60, bar_weight: 20, onboarding_completed: true },
      error: null,
    });
    supabaseFrom.mockReturnValue(chain);

    const result = await profileService.fetchUserSettings();
    expect(result).toEqual({
      recovery_timer: 60,
      bar_weight: 20,
      height: undefined,
      birth_year: undefined,
      biological_sex: undefined,
      experience_level: undefined,
      primary_goal: undefined,
      training_days_per_week: undefined,
      injuries_notes: undefined,
      gym_equipment: undefined,
      garmin_connected: false,
      onboarding_completed: true,
    });
  });

  it('saveSettings upserts mapped payload', async () => {
    const chain = createSupabaseChain({ error: null });
    supabaseFrom.mockReturnValue(chain);

    await profileService.saveSettings('user-1', {
      recovery_timer: 120,
      garmin_connected: true,
    });

    expect(supabaseFrom).toHaveBeenCalledWith('user_settings');
    expect(chain.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        timer_secs: 120,
        garmin_connected: true,
      },
      { onConflict: 'user_id' },
    );
  });

  it('saveWeight inserts biometric row', async () => {
    const chain = createSupabaseChain({ error: null });
    supabaseFrom.mockReturnValue(chain);

    await profileService.saveWeight('user-1', 78.5);

    expect(chain.insert).toHaveBeenCalledWith([{ user_id: 'user-1', weight: 78.5 }]);
  });
});
