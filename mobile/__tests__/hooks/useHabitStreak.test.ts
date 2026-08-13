import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sqliteService, fetchSessionsWithStats, useQuery } = vi.hoisted(() => ({
  sqliteService: { getAllOfflineSessions: vi.fn() },
  fetchSessionsWithStats: vi.fn(),
  useQuery: vi.fn((opts: { queryFn: () => Promise<unknown>; enabled: boolean }) => opts),
}));

vi.mock('../../src/lib/sqlite', () => ({ sqliteService }));
vi.mock('../../src/services/sessionService', () => ({
  sessionService: { fetchSessionsWithStats },
}));
vi.mock('@tanstack/react-query', () => ({ useQuery }));

import { loadHabitStreak, useHabitStreak } from '../../src/hooks/useHabitStreak';
import { SMOKE_USER_ID } from '../../src/lib/smokeMode';

describe('loadHabitStreak', () => {
  const wed = new Date(2026, 7, 12, 15, 0, 0);
  beforeEach(() => {
    vi.clearAllMocks();
    sqliteService.getAllOfflineSessions.mockResolvedValue([]);
    fetchSessionsWithStats.mockResolvedValue([]);
  });
  it('merges remote + offline', async () => {
    fetchSessionsWithStats.mockResolvedValue([{ start_time: '2026-08-12T10:00:00' }]);
    sqliteService.getAllOfflineSessions.mockResolvedValue([
      { start_time: '2026-08-11T09:00:00', user_id: 'u1' },
    ]);
    expect((await loadHabitStreak('u1', 3, wed)).currentStreak).toBe(2);
  });
  it('skips remote for smoke user', async () => {
    sqliteService.getAllOfflineSessions.mockResolvedValue([
      { start_time: '2026-08-12T10:00:00', user_id: SMOKE_USER_ID },
      { start_time: '2026-08-11T10:00:00', user_id: 'other' },
    ]);
    const streak = await loadHabitStreak(SMOKE_USER_ID, 3, wed);
    expect(fetchSessionsWithStats).not.toHaveBeenCalled();
    expect(streak.currentStreak).toBe(1);
  });
  it('failures empty + weekTarget || 3', async () => {
    fetchSessionsWithStats.mockRejectedValue(new Error('net'));
    sqliteService.getAllOfflineSessions.mockRejectedValue(new Error('db'));
    expect((await loadHabitStreak('u1', 0, wed)).weekTarget).toBe(3);
  });
});

describe('useHabitStreak', () => {
  beforeEach(() => vi.clearAllMocks());
  it('wires react-query', async () => {
    const disabled = useHabitStreak(undefined) as unknown as { enabled: boolean };
    expect(disabled.enabled).toBe(false);
    const enabled = useHabitStreak('u1', 4) as unknown as {
      enabled: boolean;
      queryFn: () => Promise<{ weekTarget: number }>;
    };
    expect(enabled.enabled).toBe(true);
    fetchSessionsWithStats.mockResolvedValue([{ start_time: '2026-08-12T10:00:00' }]);
    expect((await enabled.queryFn()).weekTarget).toBe(4);
  });
});
