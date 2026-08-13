/**
 * Platform facade: local notifications.
 * Backend: @notifee/react-native — API shaped like the former expo-notifications surface.
 */
import notifee, {
  AndroidImportance as NotifeeAndroidImportance,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';

export type NotificationBehavior = {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
  shouldShowBanner: boolean;
  shouldShowList: boolean;
};

export type NotificationPermissionsStatus = {
  status: 'granted' | 'denied' | 'undetermined';
};

export const AndroidImportance = {
  HIGH: NotifeeAndroidImportance.HIGH,
  DEFAULT: NotifeeAndroidImportance.DEFAULT,
  LOW: NotifeeAndroidImportance.LOW,
  MIN: NotifeeAndroidImportance.MIN,
  NONE: NotifeeAndroidImportance.NONE,
} as const;

export const SchedulableTriggerInputTypes = {
  TIME_INTERVAL: 'timeInterval',
} as const;

type NotificationHandler = {
  handleNotification: () => Promise<NotificationBehavior>;
};

let notificationHandler: NotificationHandler | null = null;

function mapAuthStatus(status: AuthorizationStatus): NotificationPermissionsStatus['status'] {
  if (status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }
  if (status === AuthorizationStatus.DENIED) return 'denied';
  return 'undetermined';
}

export function setNotificationHandler(handler: NotificationHandler): void {
  notificationHandler = handler;
}

/** Test helper — not part of the runtime public surface used by app services. */
export function getNotificationHandler(): NotificationHandler | null {
  return notificationHandler;
}

export async function getPermissionsAsync(): Promise<NotificationPermissionsStatus> {
  const settings = await notifee.getNotificationSettings();
  return { status: mapAuthStatus(settings.authorizationStatus) };
}

export async function requestPermissionsAsync(): Promise<NotificationPermissionsStatus> {
  const settings = await notifee.requestPermission();
  return { status: mapAuthStatus(settings.authorizationStatus) };
}

export async function setNotificationChannelAsync(
  channelId: string,
  channel: {
    name: string;
    importance?: number;
    sound?: string | null;
  },
): Promise<string> {
  return notifee.createChannel({
    id: channelId,
    name: channel.name,
    importance: channel.importance ?? NotifeeAndroidImportance.DEFAULT,
    sound: channel.sound === 'default' || !channel.sound ? 'default' : channel.sound,
  });
}

type ScheduleRequest = {
  identifier?: string;
  content: {
    title?: string;
    body?: string;
    sound?: string | boolean;
    channelId?: string;
  };
  trigger:
    | {
        type: typeof SchedulableTriggerInputTypes.TIME_INTERVAL | 'timeInterval';
        seconds: number;
      }
    | null
    | undefined;
};

export async function scheduleNotificationAsync(request: ScheduleRequest): Promise<string> {
  const seconds = Math.max(1, Math.ceil(request.trigger?.seconds ?? 1));
  const channelId = request.content.channelId ?? 'default';
  const notificationId = request.identifier;

  return notifee.createTriggerNotification(
    {
      ...(notificationId ? { id: notificationId } : {}),
      title: request.content.title,
      body: request.content.body,
      android: {
        channelId,
        pressAction: { id: 'default' },
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + seconds * 1000,
    },
  );
}

export async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  await notifee.cancelTriggerNotification(identifier);
}
