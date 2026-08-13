import { useQuery } from '@tanstack/react-query';

import { sqliteService } from '../lib/sqlite';
import { computeHabitStreak, type HabitStreak } from '../lib/streak';
import { sessionService } from '../services/sessionService';

const EMPTY: HabitStreak = {
  currentStreak: 0,
  weekCount: 0,
  weekTarget: 3,
  trainedToday: false,
};

/**
 * Streak / abitudine settimanale da sessioni remoti + offline (offline-first).
 */
export function useHabitStreak(userId: string | undefined, weekTarget = 3) {
  return useQuery({
    queryKey: ['habit-streak', userId, weekTarget],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<HabitStreak> => {
      const [remote, offline] = await Promise.all([
        sessionService.fetchSessionsWithStats().catch(() => null),
        sqliteService.getAllOfflineSessions().catch(() => []),
      ]);

      const dates: string[] = [];
      for (const s of remote || []) {
        if (s?.start_time) dates.push(s.start_time);
      }
      for (const s of offline || []) {
        if (s?.start_time) dates.push(s.start_time);
      }

      return computeHabitStreak(dates, new Date(), weekTarget || 3);
    },
    placeholderData: EMPTY,
  });
}
