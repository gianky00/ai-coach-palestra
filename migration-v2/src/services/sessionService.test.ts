import { describe, expect, it, vi } from 'vitest';

import { supabase } from '../lib/supabase';
import { sessionService } from './sessionService';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('sessionService', () => {
  it('should call fetchSessionsWithStats', async () => {
    await sessionService.fetchSessionsWithStats();
    expect(supabase.from).toHaveBeenCalledWith('workout_sessions');
  });

  it('should call deleteSession', async () => {
    await sessionService.deleteSession('sess-123');
    expect(supabase.from).toHaveBeenCalledWith('workout_sessions');
  });
});
