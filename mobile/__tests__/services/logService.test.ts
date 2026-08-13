import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../../src/lib/supabase';
import { logService } from '../../src/services/logService';

const fluent = () => {
  const api: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = () => api;
  for (const m of ['select', 'eq', 'gte', 'lte', 'lt', 'order', 'limit', 'delete']) {
    api[m] = vi.fn(self);
  }
  api.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  api.order.mockImplementation(self);
  // terminal resolves for chains ending in order/lte
  const terminal = vi.fn().mockResolvedValue({ data: [], error: null });
  Object.assign(api, { then: undefined });
  return { api, terminal };
};

describe('logService full', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchLogsForExerciseByDate / fetchTotalLogsByDate', async () => {
    const api: any = {};
    const self = () => api;
    for (const m of ['select', 'eq', 'gte', 'lte', 'order']) api[m] = vi.fn(self);
    api.order.mockResolvedValue({ data: [], error: null });
    api.lte.mockReturnValue(api);
    vi.mocked(supabase.from).mockReturnValue(api);

    const day = new Date(2026, 7, 12, 15, 0, 0);
    await logService.fetchLogsForExerciseByDate('ex-1', day);
    expect(api.eq).toHaveBeenCalledWith('exercise_id', 'ex-1');

    api.lte.mockResolvedValue({ data: [], error: null });
    await logService.fetchTotalLogsByDate(day);
    expect(supabase.from).toHaveBeenCalledWith('training_logs');
  });

  it('deleteLog / fetchWeeklyVolumeByMuscle / fetchPersonalRecord', async () => {
    const api: any = {};
    const self = () => api;
    for (const m of ['select', 'eq', 'gte', 'lte', 'lt', 'order', 'limit', 'delete']) {
      api[m] = vi.fn(self);
    }
    api.maybeSingle = vi.fn().mockResolvedValue({ data: { weight: 100, reps: 5 }, error: null });
    api.order.mockImplementation(() => api);
    api.limit.mockReturnValue({ maybeSingle: api.maybeSingle });
    api.delete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    api.gte.mockReturnValue(api);
    vi.mocked(supabase.from).mockReturnValue(api);

    await logService.deleteLog('id1');
    await logService.fetchWeeklyVolumeByMuscle();
    await logService.fetchPersonalRecord('ex');
    expect(api.maybeSingle).toHaveBeenCalled();
  });

  it('fetchLastSessionLogs senza lastLog', async () => {
    const api: any = {};
    const self = () => api;
    for (const m of ['select', 'eq', 'lt', 'order', 'limit', 'gte', 'lte']) api[m] = vi.fn(self);
    api.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    api.limit.mockReturnValue({ maybeSingle: api.maybeSingle });
    vi.mocked(supabase.from).mockReturnValue(api);

    const result = await logService.fetchLastSessionLogs('ex');
    expect(result).toEqual({ data: null });
  });

  it('fetchLastSessionLogs con giorno precedente', async () => {
    const api: any = {};
    const self = () => api;
    for (const m of ['select', 'eq', 'lt', 'order', 'limit', 'gte', 'lte']) api[m] = vi.fn(self);
    api.maybeSingle = vi.fn().mockResolvedValue({
      data: { created_at: '2026-08-10T12:00:00.000Z' },
      error: null,
    });
    api.limit.mockReturnValue({ maybeSingle: api.maybeSingle });
    api.order.mockImplementation(() => api);
    api.lte.mockReturnValue(api);
    api.gte.mockReturnValue(api);
    // final order resolves
    let orderN = 0;
    api.order.mockImplementation(() => {
      orderN += 1;
      if (orderN >= 3) return Promise.resolve({ data: [{ weight: 80 }], error: null });
      return api;
    });
    vi.mocked(supabase.from).mockReturnValue(api);

    const result = await logService.fetchLastSessionLogs('ex');
    expect(result).toBeTruthy();
  });
});
