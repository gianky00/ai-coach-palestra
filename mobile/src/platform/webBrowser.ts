/**
 * Platform facade: in-app / auth browser sessions.
 * Backend: react-native-inappbrowser-reborn (Custom Tabs / SFSafariViewController).
 */
import InAppBrowser from 'react-native-inappbrowser-reborn';

export type WebBrowserAuthSessionResult =
  { type: 'success'; url: string } | { type: 'cancel' } | { type: 'dismiss' };

export type WebBrowserCompleteAuthSessionResult = {
  type: 'success' | 'failed';
  message: string;
};

export function maybeCompleteAuthSession(options?: unknown): WebBrowserCompleteAuthSessionResult {
  void options;
  // Android Custom Tabs / iOS ASWebAuthenticationSession complete via openAuth redirect.
  return { type: 'success', message: 'completed' };
}

export async function openAuthSessionAsync(
  url: string,
  redirectUrl?: string | null,
  options?: unknown,
): Promise<WebBrowserAuthSessionResult> {
  void options;
  const redirect = redirectUrl ?? '';
  const available = await InAppBrowser.isAvailable();
  if (!available) {
    throw new Error('Browser in-app non disponibile su questo dispositivo');
  }

  const result = await InAppBrowser.openAuth(url, redirect, {
    showTitle: false,
    enableUrlBarHiding: true,
    enableDefaultShare: false,
    ephemeralWebSession: true,
  });

  if (result.type === 'success' && 'url' in result) {
    return { type: 'success', url: result.url };
  }
  if (result.type === 'dismiss') {
    return { type: 'dismiss' };
  }
  return { type: 'cancel' };
}
