import { useQuery } from '@tanstack/react-query';

import { SMOKE_USER_ID } from '../lib/smokeMode';
import { sqliteService } from '../lib/sqlite';
import { computeHabitStreak, type HabitStreak } from '../lib/streak';
import { sessionService } from '../services/sessionService';

const EMPTY: HabitStreak = {
  currentStreak: 0,
  weekCount: 0,
  weekTarget: 3,
  trainedToday: false,
};

export async function loadHabitStreak(
  userId: string,
  weekTarget = 3,
  now: Date = new Date(),
): Promise<HabitStreak> {
  const [remote, offline] = await Promise.all([
    userId !== SMOKE_USER_ID
      ? sessionService.fetchSessionsWithStats().catch(() => null)
      : Promise.resolve(null),
    sqliteService.getAllOfflineSessions().catch(() => []),
  ]);

  const dates: string[] = [];
  for (const s of remote || []) {
    if (s?.start_time) dates.push(s.start_time);
  }
  for (const s of offline || []) {
    if (!s?.start_time) continue;
    if (userId === SMOKE_USER_ID && s.user_id !== SMOKE_USER_ID) continue;
    dates.push(s.start_time);
  }

  return computeHabitStreak(dates, now, weekTarget || 3);
}

export function useHabitStreak(userId: string | undefined, weekTarget = 3) {
  return useQuery({
    queryKey: ['habit-streak', userId, weekTarget],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: () => loadHabitStreak(userId!, weekTarget),
    placeholderData: EMPTY,
  });
}
