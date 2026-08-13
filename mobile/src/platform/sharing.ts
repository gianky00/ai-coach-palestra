/**
 * Platform facade: native share sheet.
 * Backend: react-native-share.
 */
import Share from 'react-native-share';

export type SharingOptions = {
  mimeType?: string;
  dialogTitle?: string;
  UTI?: string;
};

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

export async function shareAsync(url: string, options?: SharingOptions): Promise<void> {
  await Share.open({
    url: url.startsWith('file://') || url.startsWith('content://') ? url : `file://${url}`,
    type: options?.mimeType,
    title: options?.dialogTitle,
    failOnCancel: false,
  });
}
