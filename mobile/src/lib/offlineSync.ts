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

export const syncOfflineLogs = async () => {
  const state = await fetchNetInfo();
  if (!state.isConnected || isSyncing) return;
  isSyncing = true;

  try {
    // 0. Sincronizziamo i log cancellati
    const deletedLogs = await sqliteService.getAllDeletedLogs();
    for (const logId of deletedLogs) {
      const { error } = await supabase.from('training_logs').delete().eq('id', logId);
      if (!error) {
        await sqliteService.removeDeletedLog(logId);
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
      }
    }
  } finally {
    isSyncing = false;
  }
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

  const state = await fetchNetInfo();
  if (state.isConnected) {
    const { error } = await supabase
      .from('workout_sessions')
      .insert([{ id: uuid, user_id: userId, start_time: startTime }]);

    if (!error) {
      await supabase
        .from('training_logs')
        .update({ session_id: uuid })
        .eq('user_id', userId)
        .is('session_id', null)
        .gte('created_at', targetDateIso);
    }
  }

  return { data: sess, error: null, isOffline: !state.isConnected };
};

export const endWorkoutSafely = async (sessionId: string, userId: string, endTime: string) => {
  const state = await fetchNetInfo();

  const existing = await sqliteService.getOfflineSession(sessionId);
  if (existing) {
    await sqliteService.addOfflineSession({ ...existing, end_time: endTime });
  } else {
    await sqliteService.addOfflineSession({
      id: sessionId,
      user_id: userId,
      start_time: endTime,
      end_time: endTime,
      is_new: false,
    });
  }

  if (state.isConnected) {
    await supabase.from('workout_sessions').update({ end_time: endTime }).eq('id', sessionId);
  }

  return { error: null, isOffline: !state.isConnected };
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

  const state = await fetchNetInfo();
  if (state.isConnected) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tempId, ...payload } = newLog;
    const { error } = await supabase.from('training_logs').insert([payload]);

    if (!error) {
      await sqliteService.deleteLog(newLog.tempId);
      return { error: null, data: newLog, isOffline: false };
    }
  }

  return { error: null, data: newLog, isOffline: true };
};

export const deleteLogSafely = async (tempId: string, realId?: string) => {
  await sqliteService.deleteLog(tempId);

  if (!realId) {
    return { error: null };
  }

  const state = await fetchNetInfo();
  if (state.isConnected) {
    const { error } = await supabase.from('training_logs').delete().eq('id', realId);
    if (!error) {
      return { error: null };
    }
  }

  await sqliteService.addDeletedLog(realId);
  return { error: null, isOffline: !state.isConnected };
};
