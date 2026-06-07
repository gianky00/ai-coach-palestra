import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
// In SDK 54 expo-audio è il nuovo standard
// import { useAudioPlayer } from 'expo-audio';

export const hapticService = {
  light: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  error: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};

export const soundService = {
  async playBeep() {
    // TODO: Implementare con expo-audio una volta stabilizzato il bundling
    // Per ora usiamo solo il feedback aptico per evitare crash in Expo Go
    hapticService.success();
  },

  async playClick() {
    hapticService.light();
  },
};
