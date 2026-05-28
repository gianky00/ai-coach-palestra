import { OfflineLog } from '../types';

const DB_NAME = 'kinefit_local_db';
const DB_VERSION = 2;
const STORE_NAME = 'offline_logs';

export const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Errore durante l'apertura di IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
        store.createIndex('exercise_id', 'exercise_id', { unique: false });
        store.createIndex('session_id', 'session_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('offline_sessions')) {
        db.createObjectStore('offline_sessions', { keyPath: 'id' });
      }
    };
  });
};

export const indexedDbService = {
  async addLog(log: OfflineLog): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(log);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAllLogs(): Promise<OfflineLog[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async getLogsByExercise(exerciseId: string): Promise<OfflineLog[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('exercise_id');
      const request = index.getAll(IDBKeyRange.only(exerciseId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteLog(tempId: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(tempId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearLogs(): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getQueueCount(): Promise<number> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => reject(request.error);
    });
  },

  async addOfflineSession(session: any): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offline_sessions', 'readwrite');
      const store = transaction.objectStore('offline_sessions');
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getOfflineSession(id: string): Promise<any> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offline_sessions', 'readonly');
      const store = transaction.objectStore('offline_sessions');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllOfflineSessions(): Promise<any[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offline_sessions', 'readonly');
      const store = transaction.objectStore('offline_sessions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteOfflineSession(id: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offline_sessions', 'readwrite');
      const store = transaction.objectStore('offline_sessions');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearOfflineSessions(): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offline_sessions', 'readwrite');
      const store = transaction.objectStore('offline_sessions');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
