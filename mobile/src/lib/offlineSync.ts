import { fetch as fetchNetInfo } from '@react-native-community/netinfo';

import { OfflineLog, WorkoutSession } from '../types';
import { sqliteService } from './sqlite';
import { supabase } from './supabase';

// Helper per generare UUID v4 (compatibile con Supabase)
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
    // 1. Sincronizziamo le sessioni con UPSERT (Evita duplicati se il sync è interrotto)
    const offlineSessions = await sqliteService.getAllOfflineSessions();
    for (const sess of offlineSessions) {
      const { error } = await supabase.from('workout_sessions').upsert({
        id: sess.id,
        user_id: sess.user_id,
        start_time: sess.start_time,
        end_time: sess.end_time,
      });

      if (!error || error.code === '23505') {
        // Successo o già esistente
        await sqliteService.deleteOfflineSession(sess.id);
      }
    }

    // 2. Sincronizziamo i log con UPSERT
    const queue = await sqliteService.getAllLogs();
    for (const log of queue) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tempId, ...payload } = log;

      const { error } = await supabase.from('training_logs').upsert({
        id: log.id, // Usiamo l'ID generato sul client
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

  // 1. Salviamo la sessione locale
  await sqliteService.addOfflineSession(sess);

  // 2. Link log orfani in locale
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
      // 3. Link log orfani in remoto
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

  // Aggiorniamo sempre il locale
  const existing = await sqliteService.getOfflineSession(sessionId);
  if (existing) {
    await sqliteService.addOfflineSession({ ...existing, end_time: endTime });
  } else {
    // Caso raro: sessione non trovata in locale, la creiamo
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
    tempId: uuid, // Usiamo lo stesso per semplicità interna
    id: uuid, // Questo sarà il PK su Supabase
    ...logData,
    created_at: (dateOverride || new Date()).toISOString(),
  };

  // 1. Salvataggio locale immediato
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
