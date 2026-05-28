import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsService } from './analyticsService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllLogsWithExercise', () => {
    it('should fetch logs successfully', async () => {
      const mockData = [
        {
          weight: 100,
          reps: 10,
          created_at: '2026-05-28T10:00:00Z',
          exercises: { name: 'Panca Piana', muscle_group: 'Petto' },
        },
      ];

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any);

      const result = await analyticsService.fetchAllLogsWithExercise();

      expect(fromSpy).toHaveBeenCalledWith('training_logs');
      expect(result).toEqual(mockData);
    });

    it('should return an empty array on error', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } }),
      } as any);

      const result = await analyticsService.fetchAllLogsWithExercise();

      expect(result).toEqual([]);
    });

    it('should return an empty array if data is null', async () => {
        vi.spyOn(supabase, 'from').mockReturnValue({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);
  
        const result = await analyticsService.fetchAllLogsWithExercise();
  
        expect(result).toEqual([]);
      });
  });

  describe('fetchSessionsCount', () => {
    it('should return exact count of sessions', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: 42, error: null }),
      } as any);

      const result = await analyticsService.fetchSessionsCount();

      expect(result).toBe(42);
    });

    it('should return 0 on error', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: null, error: { message: 'Count error' } }),
      } as any);

      const result = await analyticsService.fetchSessionsCount();

      expect(result).toBe(0);
    });

    it('should return 0 if count is null', async () => {
        vi.spyOn(supabase, 'from').mockReturnValue({
          select: vi.fn().mockResolvedValue({ count: null, error: null }),
        } as any);
  
        const result = await analyticsService.fetchSessionsCount();
  
        expect(result).toBe(0);
      });
  });
});
