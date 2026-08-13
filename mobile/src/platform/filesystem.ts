/**
 * Platform facade: file system (cache writes for export).
 * Backend: react-native-fs.
 */
import RNFS from 'react-native-fs';

export const cacheDirectory = `${RNFS.CachesDirectoryPath}/`;

export const EncodingType = {
  UTF8: 'utf8',
} as const;

export type EncodingTypeValue = (typeof EncodingType)[keyof typeof EncodingType];

function toFsPath(fileUri: string): string {
  return fileUri.startsWith('file://') ? fileUri.replace('file://', '') : fileUri;
}

export async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options?: { encoding?: EncodingTypeValue | string },
): Promise<void> {
  void options;
  await RNFS.writeFile(toFsPath(fileUri), contents, 'utf8');
}
