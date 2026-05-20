import { toast } from 'react-hot-toast';

import { supabase } from './supabase';

const OFFLINE_QUEUE_KEY = 'training_logs_offline_queue';

export interface OfflineLog {
  tempId: string;
  user_id: string;
  exercise_id: string;
  session_id: string | null;
  weight: number;
  reps: number;
  rpe: number;
  set_type?: 'W' | 'S' | 'F';
  created_at: string;
}

export const syncOfflineLogs = async () => {
  if (!navigator.onLine) return;

  const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queueStr) return;

  const queue: OfflineLog[] = JSON.parse(queueStr);
  if (queue.length === 0) return;

  toast.loading(`Sincronizzazione di ${queue.length} set...`, { id: 'sync' });

  const remainingQueue: OfflineLog[] = [];

  for (const log of queue) {
    const logData = { ...log } as Partial<OfflineLog>;
    delete logData.tempId;
    const { error } = await supabase.from('training_logs').insert([logData]);

    if (error) {
      console.error('Sync failed for log:', log, error);
      remainingQueue.push(log);
    }
  }

  if (remainingQueue.length === 0) {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    toast.success('Sincronizzazione completata!', { id: 'sync' });
  } else {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    toast.error(`Alcuni set (${remainingQueue.length}) non sono stati sincronizzati.`, {
      id: 'sync',
    });
  }
};

export const saveLogSafely = async (logData: Omit<OfflineLog, 'tempId' | 'created_at'>) => {
  const newLog = {
    ...logData,
    created_at: new Date().toISOString(),
  };

  if (!navigator.onLine) {
    const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: OfflineLog[] = queueStr ? JSON.parse(queueStr) : [];
    const offlineLog = { ...newLog, tempId: crypto.randomUUID() };
    queue.push(offlineLog);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    toast.success('Offline: Set salvato localmente');
    return { error: null, data: offlineLog, isOffline: true };
  }

  const { data, error } = await supabase.from('training_logs').insert([newLog]).select().single();

  if (error) {
    // Se c'è un errore ma pensiamo di essere online, potrebbe essere un timeout
    // Salviamo comunque localmente come backup se l'errore non è di validazione
    if (error.code !== '23505' && error.code !== '23503') {
      const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: OfflineLog[] = queueStr ? JSON.parse(queueStr) : [];
      const offlineLog = { ...newLog, tempId: crypto.randomUUID() };
      queue.push(offlineLog);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      toast.success('Errore rete: Set salvato localmente');
      return { error: null, data: offlineLog, isOffline: true };
    }
    return { error, data: null, isOffline: false };
  }

  return { error: null, data, isOffline: false };
};

/** Legge i log offline dalla coda per un esercizio specifico. */
export const getOfflineLogsForExercise = (exerciseId: string): OfflineLog[] => {
  const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queueStr) return [];
  return JSON.parse(queueStr).filter((l: OfflineLog) => l.exercise_id === exerciseId);
};

/** Rimuove un log offline dalla coda tramite tempId. */
export const removeOfflineLog = (tempId: string): void => {
  const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queueStr) return;
  const queue: OfflineLog[] = JSON.parse(queueStr).filter((l: OfflineLog) => l.tempId !== tempId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

/** Ritorna il numero di log nella coda offline. */
export const getOfflineQueueCount = (): number => {
  const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queueStr) return 0;
  return JSON.parse(queueStr).length;
};
