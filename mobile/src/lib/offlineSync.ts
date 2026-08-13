import { fetch as fetchNetInfo } from '@react-native-community/netinfo';

import { OfflineLog, WorkoutSession } from '../types';
import { sqliteService } from './sqlite';
import { supabase } from './supabase';
import { addSyncFailureBreadcrumb, addSyncSummaryBreadcrumb } from './syncTelemetry';

/** Postgres unique_violation — treat as idempotent success for upserts. */
export const isDuplicateConflict = (error: { code?: string } | null | undefined): boolean =>
  error?.code === '23505';

export const isSyncWriteOk = (error: { code?: string } | null | undefined): boolean =>
  !error || isDuplicateConflict(error);

const UPSERT_ON_ID = { onConflict: 'id' as const };

const devWarn = (...args: unknown[]) => {
  if ((globalThis as { __DEV__?: boolean }).__DEV__) {
    console.warn(...args);
  }
};

const generateUUID = (): string => {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

let isSyncing = false;

/** Solo per test — resetta il lock di sincronizzazione. */
export const __resetSyncStateForTests = () => {
  isSyncing = false;
};

const isNetworkOnline = async () => {
  const state = await fetchNetInfo();
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
};

export type SyncResult = { synced: number; failed: number };

export const syncOfflineLogs = async (): Promise<SyncResult> => {
  const online = await isNetworkOnline();
  if (!online || isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  let synced = 0;
  let failed = 0;
  const tombstones = new Set<string>();
  const failedSessionIds = new Set<string>();

  try {
    // 0. Sincronizziamo i log cancellati (tombstones — non ri-uploadare questi id)
    const deletedLogs = await sqliteService.getAllDeletedLogs();
    for (const logId of deletedLogs) {
      tombstones.add(logId);
      try {
        const { error } = await supabase.from('training_logs').delete().eq('id', logId);
        if (!error) {
          await sqliteService.removeDeletedLog(logId);
          synced += 1;
        } else {
          failed += 1;
          addSyncFailureBreadcrumb({
            kind: 'delete_log',
            code: error.code,
            message: error.message,
          });
          devWarn('[Sync] delete log failed', error.code ?? error.message);
        }
      } catch {
        failed += 1;
        addSyncFailureBreadcrumb({ kind: 'delete_log', message: 'threw' });
        devWarn('[Sync] delete log threw');
      }
    }

    // 1. Sessioni offline con UPSERT on id
    const offlineSessions = await sqliteService.getAllOfflineSessions();
    for (const sess of offlineSessions) {
      try {
        const { error } = await supabase.from('workout_sessions').upsert(
          {
            id: sess.id,
            user_id: sess.user_id,
            start_time: sess.start_time,
            end_time: sess.end_time,
          },
          UPSERT_ON_ID,
        );

        if (isSyncWriteOk(error)) {
          await sqliteService.deleteOfflineSession(sess.id);
          synced += 1;
        } else {
          failedSessionIds.add(sess.id);
          failed += 1;
          addSyncFailureBreadcrumb({
            kind: 'session_upsert',
            code: error?.code,
            message: error?.message,
          });
          devWarn('[Sync] session upsert failed', error?.code ?? error?.message);
        }
      } catch {
        failedSessionIds.add(sess.id);
        failed += 1;
        addSyncFailureBreadcrumb({ kind: 'session_upsert', message: 'threw' });
        devWarn('[Sync] session upsert threw');
      }
    }

    // 2. Log pendenti — skip tombstones; non strippare session_id se la sessione è fallita in questo pass
    const queue = await sqliteService.getAllLogs();
    for (const log of queue) {
      if (log.id && tombstones.has(log.id)) {
        try {
          await sqliteService.deleteLog(log.tempId);
          synced += 1;
        } catch {
          failed += 1;
        }
        continue;
      }

      try {
        const { error } = await supabase.from('training_logs').upsert(
          {
            id: log.id,
            user_id: log.user_id,
            exercise_id: log.exercise_id,
            session_id: log.session_id,
            weight: log.weight,
            reps: log.reps,
            rpe: log.rpe,
            set_type: log.set_type,
            created_at: log.created_at,
          },
          UPSERT_ON_ID,
        );

        if (isSyncWriteOk(error)) {
          await sqliteService.deleteLog(log.tempId);
          synced += 1;
          continue;
        }

        const isFk = error?.code === '23503';
        if (isFk && log.session_id && failedSessionIds.has(log.session_id)) {
          failed += 1;
          addSyncFailureBreadcrumb({
            kind: 'log_upsert',
            code: error?.code,
            message: 'waiting_on_failed_session',
          });
          devWarn('[Sync] log waiting on failed session', error?.code);
          continue;
        }

        if (isFk && log.session_id) {
          const retry = await supabase.from('training_logs').upsert(
            {
              id: log.id,
              user_id: log.user_id,
              exercise_id: log.exercise_id,
              session_id: null,
              weight: log.weight,
              reps: log.reps,
              rpe: log.rpe,
              set_type: log.set_type,
              created_at: log.created_at,
            },
            UPSERT_ON_ID,
          );
          if (isSyncWriteOk(retry.error)) {
            await sqliteService.deleteLog(log.tempId);
            synced += 1;
            continue;
          }
        }

        failed += 1;
        addSyncFailureBreadcrumb({
          kind: 'log_upsert',
          code: error?.code,
          message: error?.message,
        });
        devWarn('[Sync] log upsert failed', error?.code ?? error?.message);
      } catch {
        failed += 1;
        addSyncFailureBreadcrumb({ kind: 'log_upsert', message: 'threw' });
        devWarn('[Sync] log upsert threw');
      }
    }
  } finally {
    isSyncing = false;
  }

  addSyncSummaryBreadcrumb({ synced, failed });
  return { synced, failed };
};

export const startWorkoutSafely = async (userId: string, dateOverride?: Date) => {
  const startSource = dateOverride ? new Date(dateOverride) : new Date();
  const startTime = startSource.toISOString();
  const targetDate = new Date(startSource);
  targetDate.setHours(0, 0, 0, 0);
  const targetDateIso = targetDate.toISOString();
  const uuid = generateUUID();

  const sess: WorkoutSession = {
    id: uuid,
    user_id: userId,
    start_time: startTime,
    end_time: null,
    is_new: true,
  };

  await sqliteService.addOfflineSession(sess);

  const allLogs = await sqliteService.getAllLogs();
  const orphanLogs = allLogs.filter(
    (l) => !l.session_id && l.created_at >= targetDateIso && l.user_id === userId,
  );
  for (const log of orphanLogs) {
    await sqliteService.addLog({ ...log, session_id: uuid });
  }

  const online = await isNetworkOnline();
  if (online) {
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .insert([{ id: uuid, user_id: userId, start_time: startTime }]);

      if (isSyncWriteOk(error)) {
        await sqliteService.deleteOfflineSession(uuid);
        await supabase
          .from('training_logs')
          .update({ session_id: uuid })
          .eq('user_id', userId)
          .is('session_id', null)
          .gte('created_at', targetDateIso);
      }
    } catch {
      devWarn('[Sync] startWorkout online insert threw');
    }
  }

  return { data: sess, error: null, isOffline: !online };
};

export const endWorkoutSafely = async (
  sessionId: string,
  userId: string,
  endTime: string,
  startTime?: string,
) => {
  const online = await isNetworkOnline();

  const existing = await sqliteService.getOfflineSession(sessionId);
  if (existing) {
    await sqliteService.addOfflineSession({ ...existing, end_time: endTime });
  } else if (!online && startTime) {
    await sqliteService.addOfflineSession({
      id: sessionId,
      user_id: userId,
      start_time: startTime,
      end_time: endTime,
      is_new: false,
    });
  }

  if (online) {
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .update({ end_time: endTime })
        .eq('id', sessionId);

      if (!error) {
        await sqliteService.deleteOfflineSession(sessionId);
      }
    } catch {
      devWarn('[Sync] endWorkout online update threw');
    }
  }

  return { error: null, isOffline: !online };
};

export const saveLogSafely = async (
  logData: Omit<OfflineLog, 'tempId' | 'created_at' | 'id'>,
  dateOverride?: Date,
) => {
  const uuid = generateUUID();
  const newLog: OfflineLog = {
    tempId: uuid,
    id: uuid,
    ...logData,
    created_at: (dateOverride || new Date()).toISOString(),
  };

  await sqliteService.addLog(newLog);

  const online = await isNetworkOnline();
  if (online) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tempId, ...payload } = newLog;
    try {
      const { error } = await supabase.from('training_logs').upsert(payload, UPSERT_ON_ID);

      if (isSyncWriteOk(error)) {
        await sqliteService.deleteLog(newLog.tempId);
        return { error: null, data: newLog, isOffline: false };
      }
      addSyncFailureBreadcrumb({
        kind: 'save_log',
        code: error?.code,
        message: error?.message,
      });
      devWarn('[Sync] saveLog online upsert failed', error?.code ?? error?.message);
    } catch {
      addSyncFailureBreadcrumb({ kind: 'save_log', message: 'threw' });
      devWarn('[Sync] saveLog online upsert threw');
    }
  }

  return { error: null, data: newLog, isOffline: true };
};

export const deleteLogSafely = async (tempId: string, realId?: string) => {
  await sqliteService.deleteLog(tempId);

  if (!realId) {
    return { error: null };
  }

  const online = await isNetworkOnline();
  if (online) {
    try {
      const { error } = await supabase.from('training_logs').delete().eq('id', realId);
      if (!error) {
        return { error: null };
      }
    } catch {
      devWarn('[Sync] deleteLog online threw');
    }
  }

  await sqliteService.addDeletedLog(realId);
  return { error: null, isOffline: !online };
};
