import { beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseRpc } = vi.hoisted(() => ({
  supabaseRpc: vi.fn(),
}));

vi.mock('../../src/lib/supabase', () => ({
  supabase: { rpc: supabaseRpc },
}));

import { analyticsService } from '../../src/services/analyticsService';

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPersonalRecord returns null on error or empty', async () => {
    supabaseRpc.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    expect(await analyticsService.getPersonalRecord('ex-1')).toBeNull();

    supabaseRpc.mockResolvedValueOnce({ data: [], error: null });
    expect(await analyticsService.getPersonalRecord('ex-1')).toBeNull();
  });

  it('getPersonalRecord maps first row', async () => {
    supabaseRpc.mockResolvedValueOnce({
      data: [{ weight: 100, reps: 5, e1rm: 116.5 }],
      error: null,
    });

    const result = await analyticsService.getPersonalRecord('ex-1');
    expect(supabaseRpc).toHaveBeenCalledWith('get_personal_record', {
      p_exercise_id: 'ex-1',
    });
    expect(result).toEqual({ weight: 100, reps: 5, e1rm: 116.5 });
  });

  it('getWeeklyVolume returns empty on error', async () => {
    supabaseRpc.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    expect(await analyticsService.getWeeklyVolume(7)).toEqual([]);
  });

  it('getWeeklyVolume maps numeric volume', async () => {
    supabaseRpc.mockResolvedValueOnce({
      data: [{ day: '2026-08-01', total_volume: '1500' }],
      error: null,
    });

    const result = await analyticsService.getWeeklyVolume(14);
    expect(supabaseRpc).toHaveBeenCalledWith('get_weekly_volume', { p_days: 14 });
    expect(result).toEqual([{ day: '2026-08-01', total_volume: 1500 }]);
  });

  it('getSessionSummary returns null on error', async () => {
    supabaseRpc.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    expect(await analyticsService.getSessionSummary('s-1')).toBeNull();
  });

  it('getSessionSummary maps summary fields', async () => {
    supabaseRpc.mockResolvedValueOnce({
      data: { total_volume: '2000', sets_count: '12', duration_mins: '45' },
      error: null,
    });

    const result = await analyticsService.getSessionSummary('s-1');
    expect(supabaseRpc).toHaveBeenCalledWith('get_session_summary', {
      p_session_id: 's-1',
    });
    expect(result).toEqual({
      total_volume: 2000,
      sets_count: 12,
      duration_mins: 45,
    });
  });

  it('getSessionSummary keeps null duration', async () => {
    supabaseRpc.mockResolvedValueOnce({
      data: { total_volume: 0, sets_count: 0, duration_mins: null },
      error: null,
    });

    const result = await analyticsService.getSessionSummary('s-2');
    expect(result?.duration_mins).toBeNull();
  });
});
