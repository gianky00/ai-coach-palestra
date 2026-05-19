import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

const OFFLINE_QUEUE_KEY = 'training_logs_offline_queue';

interface OfflineLog {
  tempId: string;
  user_id: string;
  exercise_id: string;
  session_id: string | null;
  weight: number;
  reps: number;
  rpe: number;
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
    const { tempId, ...logData } = log;
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
    toast.error(`Alcuni set (${remainingQueue.length}) non sono stati sincronizzati.`, { id: 'sync' });
  }
};

export const saveLogSafely = async (logData: Omit<OfflineLog, 'tempId' | 'created_at'>) => {
  const newLog = {
    ...logData,
    created_at: new Date().toISOString()
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
