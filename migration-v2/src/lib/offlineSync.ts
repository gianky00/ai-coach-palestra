import { toast } from 'react-hot-toast';

import type { OfflineLog } from '../types';
import { indexedDbService } from './indexedDb';
import { supabase } from './supabase';

export const syncOfflineLogs = async () => {
  if (!navigator.onLine) return;

  const queue = await indexedDbService.getAllLogs();
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
    } else {
      await indexedDbService.deleteLog(log.tempId);
    }
  }

  if (remainingQueue.length === 0) {
    toast.success('Sincronizzazione completata!', { id: 'sync' });
  } else {
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
    const offlineLog: OfflineLog = { ...newLog, tempId: crypto.randomUUID() };
    await indexedDbService.addLog(offlineLog);
    toast.success('Offline: Set salvato localmente');
    return { error: null, data: offlineLog, isOffline: true };
  }

  const { data, error } = await supabase.from('training_logs').insert([newLog]).select().single();

  if (error) {
    // Se c'è un errore ma pensiamo di essere online, potrebbe essere un timeout
    // Salviamo comunque localmente come backup se l'errore non è di validazione
    if (error.code !== '23505' && error.code !== '23503') {
      const offlineLog: OfflineLog = { ...newLog, tempId: crypto.randomUUID() };
      await indexedDbService.addLog(offlineLog);
      toast.success('Errore rete: Set salvato localmente');
      return { error: null, data: offlineLog, isOffline: true };
    }
    return { error, data: null, isOffline: false };
  }

  return { error: null, data, isOffline: false };
};

/** Legge i log offline dalla coda per un esercizio specifico. */
export const getOfflineLogsForExercise = async (exerciseId: string): Promise<OfflineLog[]> => {
  return await indexedDbService.getLogsByExercise(exerciseId);
};

/** Rimuove un log offline dalla coda tramite tempId. */
export const removeOfflineLog = async (tempId: string): Promise<void> => {
  await indexedDbService.deleteLog(tempId);
};

/** Ritorna il numero di log nella coda offline. */
export const getOfflineQueueCount = async (): Promise<number> => {
  return await indexedDbService.getQueueCount();
};
