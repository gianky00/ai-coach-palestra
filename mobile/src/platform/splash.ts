/**
 * Platform facade: splash screen control.
 * Backend: AndroidX SplashScreen + KineFitSplash native hide (no react-native-splash-screen).
 */
import { NativeModules, Platform } from 'react-native';

type KineFitSplashNative = {
  hide: () => void;
};

const SplashNative = NativeModules.KineFitSplash as KineFitSplashNative | undefined;

export async function preventAutoHideAsync(): Promise<void> {
  // MainActivity starts with keepSplashOnScreen=true; nothing to do on JS side.
}

export async function hideAsync(): Promise<void> {
  if (Platform.OS === 'android') {
    SplashNative?.hide?.();
  }
}
