import { Platform } from 'react-native';

import * as Notifications from '../platform/notifications';
import { useStore } from '../store/useStore';

const TIMER_NOTIFICATION_ID = 'kinefit-timer-end';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleTimerEnd(seconds: number): Promise<void> {
    if (!useStore.getState().notificationsEnabled || seconds <= 0) return;

    try {
      const granted = await this.requestPermission();
      if (!granted) return;

      await this.cancelTimerEnd();

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('timer', {
          name: 'Timer Recupero',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }

      await Notifications.scheduleNotificationAsync({
        identifier: TIMER_NOTIFICATION_ID,
        content: {
          title: 'Recupero completato',
          body: 'Pronto per il prossimo set!',
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'timer' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.ceil(seconds)),
        },
      });
    } catch (err) {
      // Timer UI must keep running even if Notifee fails.
      console.warn('[Notifications] scheduleTimerEnd failed', err);
    }
  },

  async cancelTimerEnd(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
    } catch {
      // Notification may not exist
    }
  },
};
