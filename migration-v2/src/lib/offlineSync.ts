import { toast } from 'react-hot-toast';

import { useStore } from '../store/useStore';
import type { OfflineLog } from '../types';
import { indexedDbService } from './indexedDb';
import { supabase } from './supabase';

let isSyncing = false;

export const syncOfflineLogs = async () => {
  if (!navigator.onLine || isSyncing) return;
  isSyncing = true;

  try {
    // 1. Sincronizziamo prima le sessioni offline
    try {
      const offlineSessions = await indexedDbService.getAllOfflineSessions();
      if (offlineSessions.length > 0) {
        toast.loading(`Sincronizzazione di ${offlineSessions.length} sessioni...`, {
          id: 'sync-sessions',
        });

        for (const sess of offlineSessions) {
          if (sess.is_new) {
            try {
              const { data, error } = await supabase
                .from('workout_sessions')
                .insert([
                  { user_id: sess.user_id, start_time: sess.start_time, end_time: sess.end_time },
                ])
                .select()
                .single();

              if (!error && data) {
                const realSessionId = data.id;
                // Sincronizza lo stato di Zustand se la sessione attiva era quella temporanea
                if (useStore.getState().activeSession === sess.id) {
                  useStore.getState().setActiveSession(realSessionId);
                }

                // Aggiorna tutti i log in coda che puntano al vecchio temp ID
                const logs = await indexedDbService.getAllLogs();
                for (const log of logs) {
                  if (log.session_id === sess.id) {
                    const updatedLog = { ...log, session_id: realSessionId };
                    await indexedDbService.addLog(updatedLog);
                  }
                }
                await indexedDbService.deleteOfflineSession(sess.id);
              } else {
                console.error('Errore inserimento sessione offline:', error);
                if (error && (error.code === '23503' || error.code === '23502')) {
                  await indexedDbService.deleteOfflineSession(sess.id);
                }
              }
            } catch (netErr) {
              console.warn('Network error insert session:', netErr);
            }
          } else {
            // Sessione online chiusa offline
            try {
              const { error } = await supabase
                .from('workout_sessions')
                .update({ end_time: sess.end_time })
                .eq('id', sess.id);

              if (!error) {
                await indexedDbService.deleteOfflineSession(sess.id);
              } else {
                console.error('Errore aggiornamento sessione offline:', error);
                if (error && (error.code === 'PGRST116' || error.code === '23503')) {
                  await indexedDbService.deleteOfflineSession(sess.id);
                }
              }
            } catch (netErr) {
              console.warn('Network error update session:', netErr);
            }
          }
        }
        toast.dismiss('sync-sessions');
      }
    } catch (err) {
      console.error('Errore durante la sinc delle sessioni:', err);
      toast.dismiss('sync-sessions');
    }

    // 2. Sincronizziamo i log offline
    const queue = await indexedDbService.getAllLogs();
    if (queue.length === 0) return;

    toast.loading(`Sincronizzazione di ${queue.length} set...`, { id: 'sync' });

    const remainingQueue: OfflineLog[] = [];

    for (const log of queue) {
      const logData = { ...log } as Partial<OfflineLog>;
      delete logData.tempId;

      try {
        const { error } = await supabase.from('training_logs').insert([logData]);

        if (error) {
          console.error('Sync failed for log:', log, error);
          if (error.code === '23503') {
            console.warn(
              'Rilevato errore di vincolo permanente (23503). Rimuovo log orfano dalla coda.',
            );
            await indexedDbService.deleteLog(log.tempId);
          } else {
            remainingQueue.push(log);
          }
        } else {
          await indexedDbService.deleteLog(log.tempId);
        }
      } catch (netErr) {
        console.warn('Network error sync log:', netErr);
        remainingQueue.push(log);
      }
    }

    if (remainingQueue.length === 0) {
      toast.success('Sincronizzazione completata!', { id: 'sync' });
    } else {
      toast.error(`Alcuni set (${remainingQueue.length}) non sono stati sincronizzati.`, {
        id: 'sync',
      });
    }
  } finally {
    isSyncing = false;
  }
};

export const saveLogSafely = async (logData: Omit<OfflineLog, 'tempId' | 'created_at'>) => {
  const newLog = {
    ...logData,
    created_at: new Date().toISOString(),
  };

  // Controlla se la sessione associata è offline ed è nuova (quindi ha un ID temporaneo non ancora su Supabase)
  let isTempSession = false;
  if (logData.session_id) {
    const localSess = await indexedDbService.getOfflineSession(logData.session_id);
    if (localSess && localSess.is_new) {
      isTempSession = true;
    }
  }

  // Se siamo offline O se la sessione associata è temporanea, salviamo localmente
  if (!navigator.onLine || isTempSession) {
    const offlineLog: OfflineLog = { ...newLog, tempId: crypto.randomUUID() };
    await indexedDbService.addLog(offlineLog);
    toast.success('Offline: Set salvato localmente');
    return { error: null, data: offlineLog, isOffline: true };
  }

  try {
    const { data, error } = await supabase.from('training_logs').insert([newLog]).select().single();

    if (error) {
      // Se c'è un errore ma pensiamo di essere online, salviamo localmente come backup se l'errore non è di validazione
      if (error.code !== '23505' && error.code !== '23503') {
        const offlineLog: OfflineLog = { ...newLog, tempId: crypto.randomUUID() };
        await indexedDbService.addLog(offlineLog);
        toast.success('Errore rete: Set salvato localmente');
        return { error: null, data: offlineLog, isOffline: true };
      }
      return { error, data: null, isOffline: false };
    }

    return { error: null, data, isOffline: false };
  } catch (netErr) {
    console.warn('Network fallback triggered in saveLogSafely:', netErr);
    const offlineLog: OfflineLog = { ...newLog, tempId: crypto.randomUUID() };
    await indexedDbService.addLog(offlineLog);
    toast.success('Errore rete: Set salvato localmente');
    return { error: null, data: offlineLog, isOffline: true };
  }
};

export const startWorkoutSafely = async (userId: string) => {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert([{ user_id: userId, start_time: new Date().toISOString() }])
        .select()
        .single();
      if (!error && data) {
        return { data, error: null, isOffline: false };
      }
    } catch (e) {
      console.warn('Errore rete Supabase, fallback offline:', e);
    }
  }

  // Se siamo offline o la chiamata fallisce
  const tempSessionId = crypto.randomUUID();
  const offlineSession = {
    id: tempSessionId,
    user_id: userId,
    start_time: new Date().toISOString(),
    end_time: null,
    is_new: true,
  };

  await indexedDbService.addOfflineSession(offlineSession);
  toast.success('Offline: Allenamento iniziato localmente');
  return { data: offlineSession, error: null, isOffline: true };
};

export const endWorkoutSafely = async (
  sessionId: string,
  userId: string,
  endTime: string = new Date().toISOString(),
) => {
  // Controlliamo prima se questa sessione è locale/offline
  const localSession = await indexedDbService.getOfflineSession(sessionId);

  if (localSession) {
    // Aggiorniamo la sessione offline localmente
    const updatedSession = { ...localSession, end_time: endTime };
    await indexedDbService.addOfflineSession(updatedSession);
    toast.success('Offline: Allenamento terminato localmente');
    return { error: null, isOffline: true };
  }

  // Se non è presente localmente, proviamo online
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .update({ end_time: endTime })
        .eq('id', sessionId);

      if (!error) {
        return { error: null, isOffline: false };
      }
    } catch (e) {
      console.warn('Errore terminazione online, salvataggio azione offline:', e);
    }
  }

  // Se siamo offline o la chiamata online fallisce per una sessione originata online
  const offlineSessionAction = {
    id: sessionId,
    user_id: userId,
    start_time: new Date().toISOString(),
    end_time: endTime,
    is_new: false,
  };
  await indexedDbService.addOfflineSession(offlineSessionAction);
  toast.success('Offline: Chiusura salvata localmente');
  return { error: null, isOffline: true };
};

/** Legge i log offline dalla coda per un esercizio specifico. */
export const getOfflineLogsForExercise = async (exerciseId: string): Promise<OfflineLog[]> => {
  return await indexedDbService.getLogsByExercise(exerciseId);
};

/** Rimuove un log offline dalla coda tramite tempId. */
export const removeOfflineLog = async (tempId: string): Promise<void> => {
  await indexedDbService.deleteLog(tempId);
};

/** Ritorna il numero di log e sessioni nella coda offline. */
export const getOfflineQueueCount = async (): Promise<number> => {
  const logsCount = await indexedDbService.getQueueCount();
  const sessions = await indexedDbService.getAllOfflineSessions();
  return logsCount + sessions.length;
};
