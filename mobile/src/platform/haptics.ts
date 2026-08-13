/**
 * Platform facade: haptic feedback.
 * Backend: react-native-haptic-feedback.
 */
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
}

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

function impactType(style: ImpactFeedbackStyle | string): string {
  switch (String(style)) {
    case ImpactFeedbackStyle.Light:
    case 'light':
      return 'impactLight';
    case ImpactFeedbackStyle.Heavy:
    case 'heavy':
      return 'impactHeavy';
    default:
      return 'impactMedium';
  }
}

function notificationType(type: NotificationFeedbackType | string): string {
  switch (String(type)) {
    case NotificationFeedbackType.Error:
    case 'error':
      return 'notificationError';
    case NotificationFeedbackType.Warning:
    case 'warning':
      return 'notificationWarning';
    default:
      return 'notificationSuccess';
  }
}

export async function impactAsync(style: ImpactFeedbackStyle | string): Promise<void> {
  ReactNativeHapticFeedback.trigger(impactType(style), options);
}

export async function notificationAsync(type: NotificationFeedbackType | string): Promise<void> {
  ReactNativeHapticFeedback.trigger(notificationType(type), options);
}
