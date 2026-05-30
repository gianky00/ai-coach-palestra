import { describe, expect, it, vi } from 'vitest';

import { supabase } from '../lib/supabase';
import { profileService } from './profileService';

vi.mock('../lib/supabase', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

describe('profileService', () => {
  it('fetchWeightHistory should return data when supabase query is successful', async () => {
    const mockData = [
      { weight: 75, created_at: '2026-05-20T10:00:00Z' },
      { weight: 76, created_at: '2026-05-21T10:00:00Z' },
    ];

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const result = await profileService.fetchWeightHistory();
    expect(supabase.from).toHaveBeenCalledWith('biometrics');
    expect(mockQuery.select).toHaveBeenCalledWith('weight, created_at');
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(result).toEqual(mockData);
  });

  it('fetchWeightHistory should return empty array on error', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const result = await profileService.fetchWeightHistory();
    expect(result).toEqual([]);
  });

  it('fetchUserSettings should return user settings when successful', async () => {
    const mockSettings = { recovery_timer: 120, bar_weight: 20 };
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const result = await profileService.fetchUserSettings();
    expect(supabase.from).toHaveBeenCalledWith('user_settings');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.maybeSingle).toHaveBeenCalled();
    expect(result).toEqual(mockSettings);
  });

  it('fetchUserSettings should return null on error', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('Error') }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const result = await profileService.fetchUserSettings();
    expect(result).toBeNull();
  });

  it('saveWeight should insert biometric weight correctly', async () => {
    const mockQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    await profileService.saveWeight('user-123', 78.5);
    expect(supabase.from).toHaveBeenCalledWith('biometrics');
    expect(mockQuery.insert).toHaveBeenCalledWith([
      {
        user_id: 'user-123',
        weight: 78.5,
      },
    ]);
  });

  it('saveSettings should upsert user settings correctly', async () => {
    const mockQuery = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    await profileService.saveSettings('user-123', {
      recovery_timer: 150,
      bar_weight: 15
    });
    expect(supabase.from).toHaveBeenCalledWith('user_settings');
    expect(mockQuery.upsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      timer_secs: 150,
      bar_weight: 15,
    });
  });
});
