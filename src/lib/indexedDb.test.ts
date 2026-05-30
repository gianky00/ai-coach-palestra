import { beforeEach, describe, expect, it, vi } from 'vitest';

import { indexedDbService } from './indexedDb';

// Simple mock for IndexedDB
const mockDB = {
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(),
  },
  createObjectStore: vi.fn(() => ({
    createIndex: vi.fn(),
  })),
};

const mockTransaction = {
  objectStore: vi.fn(),
};

const mockStore = {
  put: vi.fn(),
  getAll: vi.fn(),
  index: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  count: vi.fn(),
  get: vi.fn(),
};

const createMockRequest = (resultData?: any) => {
  const req: any = {
    onsuccess: null,
    onerror: null,
    result: resultData,
    error: null,
  };
  // Automatically trigger onsuccess on next tick if someone assigned it
  setTimeout(() => {
    if (req.onsuccess) req.onsuccess();
  }, 0);
  return req;
};

describe('indexedDbService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('IDBKeyRange', {
      only: vi.fn((key) => `IDBKeyRange.only(${key})`),
    });

    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => createMockRequest(mockDB)),
    });

    mockDB.transaction.mockReturnValue(mockTransaction);
    mockTransaction.objectStore.mockReturnValue(mockStore);
  });

  it('addLog should put log into store', async () => {
    mockStore.put.mockImplementation(() => createMockRequest());
    const log = { tempId: '1', weight: 10, reps: 5 } as any;

    await indexedDbService.addLog(log);

    expect(mockDB.transaction).toHaveBeenCalledWith('offline_logs', 'readwrite');
    expect(mockStore.put).toHaveBeenCalledWith(log);
  });

  it('getAllLogs should return all logs', async () => {
    const mockLogs = [{ tempId: '1' }];
    mockStore.getAll.mockImplementation(() => createMockRequest(mockLogs));

    const result = await indexedDbService.getAllLogs();
    expect(result).toEqual(mockLogs);
  });

  it('deleteLog should remove log', async () => {
    mockStore.delete.mockImplementation(() => createMockRequest());

    await indexedDbService.deleteLog('temp-1');
    expect(mockStore.delete).toHaveBeenCalledWith('temp-1');
  });

  it('getQueueCount should return count', async () => {
    mockStore.count.mockImplementation(() => createMockRequest(5));

    const result = await indexedDbService.getQueueCount();
    expect(result).toBe(5);
  });

  it('handle error in openDb', async () => {
    const errorReq = {
      onerror: null as any,
      onsuccess: null,
      error: new Error('mock err'),
    };
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => errorReq),
    });

    setTimeout(() => {
      if (errorReq.onerror) errorReq.onerror();
    }, 0);

    await expect(indexedDbService.getAllLogs()).rejects.toThrow(
      "Errore durante l'apertura di IndexedDB",
    );
  });

  it('handle onupgradeneeded', async () => {
    mockDB.objectStoreNames.contains.mockReturnValue(false); // Simulate missing stores
    const upgradeReq: any = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB,
      error: null,
    };

    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => upgradeReq),
    });

    setTimeout(() => {
      if (upgradeReq.onupgradeneeded) upgradeReq.onupgradeneeded();
      if (upgradeReq.onsuccess) upgradeReq.onsuccess();
    }, 0);

    await indexedDbService.getAllLogs();

    // Verify creation
    expect(mockDB.createObjectStore).toHaveBeenCalledWith('offline_logs', { keyPath: 'tempId' });
    expect(mockDB.createObjectStore).toHaveBeenCalledWith('offline_sessions', { keyPath: 'id' });
  });

  it('getLogsByExercise should use index', async () => {
    const mockIndex = { getAll: vi.fn(() => createMockRequest([])) };
    mockStore.index.mockReturnValue(mockIndex);

    await indexedDbService.getLogsByExercise('ex1');
    expect(mockStore.index).toHaveBeenCalledWith('exercise_id');
  });

  it('session methods (add, get, getAll, delete, clear)', async () => {
    mockStore.put.mockImplementation(() => createMockRequest());
    await indexedDbService.addOfflineSession({ id: 's1' } as any);
    expect(mockDB.transaction).toHaveBeenCalledWith('offline_sessions', 'readwrite');

    mockStore.get.mockImplementation(() => createMockRequest({ id: 's1' }));
    const s = await indexedDbService.getOfflineSession('s1');
    expect(s.id).toBe('s1');

    mockStore.getAll.mockImplementation(() => createMockRequest([{ id: 's1' }]));
    await indexedDbService.getAllOfflineSessions();

    mockStore.delete.mockImplementation(() => createMockRequest());
    await indexedDbService.deleteOfflineSession('s1');

    mockStore.clear.mockImplementation(() => createMockRequest());
    await indexedDbService.clearOfflineSessions();
    await indexedDbService.clearLogs();
  });
});
