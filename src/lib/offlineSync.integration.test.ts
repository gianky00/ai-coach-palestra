import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as offlineSync from './offlineSync';
import { indexedDbService } from './indexedDb';
import { supabase } from './supabase';

vi.mock('./supabase');
vi.mock('./indexedDb');

describe('OfflineSync Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
        writable: true
    });
  });

  it('should sync local logs to supabase and clear local storage', async () => {
    const mockLocalLogs = [
      { tempId: '1', user_id: 'u1', exercise_id: 'e1', weight: 100, reps: 10, created_at: new Date().toISOString() },
      { tempId: '2', user_id: 'u1', exercise_id: 'e2', weight: 80, reps: 12, created_at: new Date().toISOString() }
    ];

    vi.mocked(indexedDbService.getAllOfflineSessions).mockResolvedValue([]);
    vi.mocked(indexedDbService.getAllLogs).mockResolvedValue(mockLocalLogs as any);
    
    // Mock successful supabase inserts
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null })
    } as any);

    await offlineSync.syncOfflineLogs();

    // Verify it tried to insert logs
    expect(supabase.from).toHaveBeenCalledWith('training_logs');
    
    // Verify it deleted from local DB after success
    expect(indexedDbService.deleteLog).toHaveBeenCalledTimes(2);
  });

  it('should NOT delete logs from local DB if sync fails', async () => {
    const mockLocalLogs = [
        { tempId: '1', user_id: 'u1', exercise_id: 'e1', weight: 100, reps: 10, created_at: new Date().toISOString() }
      ];
  
      vi.mocked(indexedDbService.getAllOfflineSessions).mockResolvedValue([]);
      vi.mocked(indexedDbService.getAllLogs).mockResolvedValue(mockLocalLogs as any);
      
      // Mock failed supabase insert
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Network Error' } })
      } as any);
  
      await offlineSync.syncOfflineLogs();
  
      expect(indexedDbService.deleteLog).not.toHaveBeenCalled();
  });
});
