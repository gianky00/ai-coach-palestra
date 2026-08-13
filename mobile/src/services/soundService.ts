import { Platform } from 'react-native';

import timerBeep from '../../assets/timer-beep.mp3';
import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from '../platform/audio';
import * as Haptics from '../platform/haptics';
import { useStore } from '../store/useStore';

const isHapticsEnabled = () => useStore.getState().hapticsEnabled;
const isSoundEnabled = () => useStore.getState().timerSoundEnabled;

let beepPlayer: AudioPlayer | null = null;
let audioModeReady = false;

const ensureAudioMode = async () => {
  if (audioModeReady) return;
  await setAudioModeAsync({ playsInSilentMode: true });
  audioModeReady = true;
};

export const hapticService = {
  light: () => {
    if (Platform.OS !== 'web' && isHapticsEnabled())
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (Platform.OS !== 'web' && isHapticsEnabled())
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    if (Platform.OS !== 'web' && isHapticsEnabled())
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    if (Platform.OS !== 'web' && isHapticsEnabled())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  error: () => {
    if (Platform.OS !== 'web' && isHapticsEnabled())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};

export const soundService = {
  async playBeep() {
    if (Platform.OS !== 'web' && isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (!isSoundEnabled() || Platform.OS === 'web') return;

    try {
      await ensureAudioMode();
      if (!beepPlayer) {
        beepPlayer = createAudioPlayer(timerBeep);
      }
      beepPlayer.seekTo(0);
      beepPlayer.play();
    } catch {
      // Asset o player non disponibile — haptic già emesso sopra
    }
  },

  async playClick() {
    hapticService.light();
  },
};
