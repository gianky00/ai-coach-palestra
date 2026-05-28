import { beforeEach, describe, expect, it, vi } from 'vitest';
import { historyService } from './historyService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('historyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchExerciseOptions', () => {
    it('should fetch and deduplicate exercise options', async () => {
      const mockData = [
        { id: '1', name: 'Bench Press' },
        { id: '2', name: 'Bench Press' }, // Duplicate name
        { id: '3', name: 'Squat' },
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any);

      const result = await historyService.fetchExerciseOptions();

      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toContain('Bench Press');
      expect(result.map(r => r.name)).toContain('Squat');
    });

    it('should return empty array on error', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any);

      const result = await historyService.fetchExerciseOptions();
      expect(result).toEqual([]);
    });
  });

  describe('fetchExerciseProgression', () => {
    it('should fetch progression data correctly', async () => {
      const mockData = [{ weight: 100, reps: 10, created_at: '2026-01-01' }];
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any);

      const result = await historyService.fetchExerciseProgression('Bench Press');
      expect(result).toEqual(mockData);
    });

    it('should return empty array on error', async () => {
        vi.spyOn(supabase, 'from').mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
        } as any);
  
        const result = await historyService.fetchExerciseProgression('Bench Press');
        expect(result).toEqual([]);
      });
  });
});
