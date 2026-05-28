import { describe, expect, it, vi } from 'vitest';

import { supabase } from '../lib/supabase';
import { exerciseService } from './exerciseService';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('exerciseService', () => {
  it('should call fetchTodayExercises with correct params', async () => {
    await exerciseService.fetchTodayExercises('user-123');
    expect(supabase.from).toHaveBeenCalledWith('exercises');
  });

  it('should call addExercise with correct params', async () => {
    await exerciseService.addExercise('user-123', 'Panca Piana', 'Petto');
    expect(supabase.from).toHaveBeenCalledWith('exercises');
  });
});
