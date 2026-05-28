import { describe, expect, it, vi } from 'vitest';

import { supabase } from '../lib/supabase';
import { logService } from './logService';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          lt: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
          order: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
        })),
        gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('logService', () => {
  it('should call fetchTodayLogsForExercise', async () => {
    await logService.fetchTodayLogsForExercise('ex-123');
    expect(supabase.from).toHaveBeenCalledWith('training_logs');
  });

  it('should call fetchTodayTotalLogs', async () => {
    await logService.fetchTodayTotalLogs();
    expect(supabase.from).toHaveBeenCalledWith('training_logs');
  });

  it('should call deleteLog', async () => {
    await logService.deleteLog('log-123');
    expect(supabase.from).toHaveBeenCalledWith('training_logs');
  });

  it('should call fetchWeeklyVolumeByMuscle', async () => {
    await logService.fetchWeeklyVolumeByMuscle();
    expect(supabase.from).toHaveBeenCalledWith('training_logs');
  });

  it('should call fetchPersonalRecord', async () => {
    await logService.fetchPersonalRecord('ex-123');
    expect(supabase.from).toHaveBeenCalledWith('training_logs');
  });

  it('should call fetchLastSessionLog', async () => {
    await logService.fetchLastSessionLog('ex-123');
    expect(supabase.from).toHaveBeenCalledWith('training_logs');
  });
});
