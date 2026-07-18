import { fetch as fetchNetInfo } from '@react-native-community/netinfo';

import { OfflineLog, WorkoutSession } from '../types';
import { sqliteService } from './sqlite';
import { supabase } from './supabase';

const generateUUID = () => {
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
  // isConnected/isInternetReachable possono essere null mentre NetInfo è incertezza
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

  try {
    // 0. Sincronizziamo i log cancellati
    const deletedLogs = await sqliteService.getAllDeletedLogs();
    for (const logId of deletedLogs) {
      const { error } = await supabase.from('training_logs').delete().eq('id', logId);
      // 0 rows = già assente sul server → ok ripulire localmente
      if (!error) {
        await sqliteService.removeDeletedLog(logId);
        synced += 1;
      } else {
        failed += 1;
        console.warn('[Sync] delete log failed', logId, error.message);
      }
    }

    // 1. Sincronizziamo le sessioni con UPSERT
    const offlineSessions = await sqliteService.getAllOfflineSessions();
    for (const sess of offlineSessions) {
      const { error } = await supabase.from('workout_sessions').upsert({
        id: sess.id,
        user_id: sess.user_id,
        start_time: sess.start_time,
        end_time: sess.end_time,
      });

      if (!error || error.code === '23505') {
        await sqliteService.deleteOfflineSession(sess.id);
        synced += 1;
      } else {
        failed += 1;
        console.warn('[Sync] session upsert failed', sess.id, error.message);
      }
    }

    // 2. Sincronizziamo i log pendenti con UPSERT
    const queue = await sqliteService.getAllLogs();
    for (const log of queue) {
      const { error } = await supabase.from('training_logs').upsert({
        id: log.id,
        user_id: log.user_id,
        exercise_id: log.exercise_id,
        session_id: log.session_id,
        weight: log.weight,
        reps: log.reps,
        rpe: log.rpe,
        set_type: log.set_type,
        created_at: log.created_at,
      });

      if (!error || error.code === '23505') {
        await sqliteService.deleteLog(log.tempId);
        synced += 1;
      } else {
        // Sessione non ancora sul server / FK: riprova senza session_id
        const isFk = error.code === '23503';
        if (isFk && log.session_id) {
          const retry = await supabase.from('training_logs').upsert({
            id: log.id,
            user_id: log.user_id,
            exercise_id: log.exercise_id,
            session_id: null,
            weight: log.weight,
            reps: log.reps,
            rpe: log.rpe,
            set_type: log.set_type,
            created_at: log.created_at,
          });
          if (!retry.error || retry.error.code === '23505') {
            await sqliteService.deleteLog(log.tempId);
            synced += 1;
            continue;
          }
        }
        failed += 1;
        console.warn('[Sync] log upsert failed', log.tempId, error.message);
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
};

export const startWorkoutSafely = async (userId: string, dateOverride?: Date) => {
  const startTime = (dateOverride || new Date()).toISOString();
  const targetDate = dateOverride || new Date();
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
    const { error } = await supabase
      .from('workout_sessions')
      .insert([{ id: uuid, user_id: userId, start_time: startTime }]);

    if (!error) {
      await sqliteService.deleteOfflineSession(uuid);
      await supabase
        .from('training_logs')
        .update({ session_id: uuid })
        .eq('user_id', userId)
        .is('session_id', null)
        .gte('created_at', targetDateIso);
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
    const { error } = await supabase
      .from('workout_sessions')
      .update({ end_time: endTime })
      .eq('id', sessionId);

    if (!error) {
      await sqliteService.deleteOfflineSession(sessionId);
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
    const { error } = await supabase.from('training_logs').upsert(payload);

    if (!error) {
      await sqliteService.deleteLog(newLog.tempId);
      return { error: null, data: newLog, isOffline: false };
    }
    console.warn('[Sync] saveLog online upsert failed', error.message);
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
    const { error } = await supabase.from('training_logs').delete().eq('id', realId);
    if (!error) {
      return { error: null };
    }
  }

  await sqliteService.addDeletedLog(realId);
  return { error: null, isOffline: !online };
};
