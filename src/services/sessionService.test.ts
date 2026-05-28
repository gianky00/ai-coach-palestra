import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from './sessionService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchSessionsWithStats', async () => {
    const mockData = [{ id: '1', start_time: '...', end_time: '...', training_logs: [] }];
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData }),
    } as any);

    const result = await sessionService.fetchSessionsWithStats();
    expect(result).toEqual(mockData);
  });

  it('deleteSession', async () => {
    const deleteSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabase, 'from').mockReturnValue({
      delete: deleteSpy,
      eq: eqSpy,
    } as any);

    await sessionService.deleteSession('123');
    expect(eqSpy).toHaveBeenCalledWith('id', '123');
  });

  it('fetchSessionDetails', async () => {
    const mockDetails = [{ weight: 100 }];
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockDetails }),
    } as any);

    const result = await sessionService.fetchSessionDetails('123');
    expect(result.data).toEqual(mockDetails);
  });

  it('fetchActiveSession', async () => {
    const mockSession = { id: 'active' };
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockSession }),
    } as any);

    const result = await sessionService.fetchActiveSession();
    expect(result.data).toEqual(mockSession);
  });

  it('startWorkout', async () => {
    const mockSession = { id: 'new' };
    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSession }),
    } as any);

    const result = await sessionService.startWorkout('user1');
    expect(result.data).toEqual(mockSession);
  });

  it('endWorkout', async () => {
    const updateSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabase, 'from').mockReturnValue({
      update: updateSpy,
      eq: eqSpy,
    } as any);

    await sessionService.endWorkout('123', '2026-05-28T12:00:00Z');
    expect(updateSpy).toHaveBeenCalledWith({ end_time: '2026-05-28T12:00:00Z' });
    expect(eqSpy).toHaveBeenCalledWith('id', '123');
  });
});
