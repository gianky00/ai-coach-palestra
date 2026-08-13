/**
 * Platform facade: splash screen control.
 * Backend: react-native-splash-screen (theme splash on launch; hide safe if show skipped).
 */
import SplashScreen from 'react-native-splash-screen';

export async function preventAutoHideAsync(): Promise<void> {}

export async function hideAsync(): Promise<void> {
  try {
    SplashScreen.hide();
  } catch {
    /* show() may be skipped on Pixel 9a */
  }
}
