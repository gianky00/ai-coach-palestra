/**
 * Platform facade: short audio playback.
 * Backend: react-native-sound — API shaped like the former expo-audio player surface.
 */
import { Platform } from 'react-native';
import Sound from 'react-native-sound';

export type AudioPlayer = {
  seekTo: (seconds: number) => void | Promise<void>;
  play: () => void;
};

type AudioSource = number | string | { uri?: string };

let categoryReady = false;

export async function setAudioModeAsync(mode: { playsInSilentMode?: boolean }): Promise<void> {
  if (categoryReady) return;
  if (Platform.OS === 'ios') {
    Sound.setCategory(mode.playsInSilentMode ? 'Playback' : 'Ambient', true);
  }
  categoryReady = true;
}

export function createAudioPlayer(source: AudioSource): AudioPlayer {
  const resolved =
    typeof source === 'number' ? source : typeof source === 'string' ? source : (source?.uri ?? '');

  let sound: Sound | null = null;
  let ready = false;
  let failed = false;
  const pending: Array<() => void> = [];

  sound = new Sound(resolved as number | string, (error) => {
    if (error) {
      failed = true;
      pending.length = 0;
      return;
    }
    ready = true;
    pending.splice(0).forEach((fn) => fn());
  });

  return {
    seekTo(seconds: number) {
      if (!sound || failed) return;
      if (!ready) {
        pending.push(() => sound?.setCurrentTime(seconds));
        return;
      }
      sound.setCurrentTime(seconds);
    },
    play() {
      if (!sound || failed) return;
      const doPlay = () => sound?.play();
      if (!ready) {
        pending.push(doPlay);
        return;
      }
      doPlay();
    },
  };
}
