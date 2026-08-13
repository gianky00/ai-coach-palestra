import { beforeEach, describe, expect, it, vi } from 'vitest';

const notifications = vi.hoisted(() => {
  let handlerCfg: { handleNotification: () => Promise<Record<string, boolean>> } | null = null;
  return {
    getHandlerCfg: () => handlerCfg,
    setNotificationHandler: vi.fn(
      (cfg: { handleNotification: () => Promise<Record<string, boolean>> }) => {
        handlerCfg = cfg;
      },
    ),
    getPermissionsAsync: vi.fn(),
    requestPermissionsAsync: vi.fn(),
    setNotificationChannelAsync: vi.fn(),
    scheduleNotificationAsync: vi.fn(),
    cancelScheduledNotificationAsync: vi.fn(),
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  };
});

const storeState = vi.hoisted(() => ({
  notificationsEnabled: true,
}));

vi.mock('../../src/platform/notifications', () => notifications);

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('../../src/store/useStore', () => ({
  useStore: {
    getState: () => storeState,
  },
}));

import { notificationService } from '../../src/services/notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.notificationsEnabled = true;
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    notifications.scheduleNotificationAsync.mockResolvedValue('id');
    notifications.setNotificationChannelAsync.mockResolvedValue(undefined);
  });

  it('requestPermission false su web', async () => {
    const rn = await import('react-native');
    (rn.Platform as { OS: string }).OS = 'web';
    expect(await notificationService.requestPermission()).toBe(false);
    (rn.Platform as { OS: string }).OS = 'android';
  });

  it('requestPermission chiede permesso se necessario', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    expect(await notificationService.requestPermission()).toBe(true);
  });

  it('scheduleTimerEnd no-op se disabled o seconds<=0', async () => {
    storeState.notificationsEnabled = false;
    await notificationService.scheduleTimerEnd(30);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();

    storeState.notificationsEnabled = true;
    await notificationService.scheduleTimerEnd(0);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('scheduleTimerEnd crea channel android e schedula', async () => {
    await notificationService.scheduleTimerEnd(45);
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalled();
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('cancelTimerEnd swallows missing id', async () => {
    notifications.cancelScheduledNotificationAsync.mockRejectedValue(new Error('missing'));
    await expect(notificationService.cancelTimerEnd()).resolves.toBeUndefined();
  });

  it('notification handler abilita alert, sound, banner e list', async () => {
    const cfg = notifications.getHandlerCfg();
    expect(cfg).toBeTruthy();
    await expect(cfg!.handleNotification()).resolves.toEqual({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    });
  });
});
