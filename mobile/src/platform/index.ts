/**
 * Platform facade barrel.
 *
 * Prefer named module imports for tree-shaking / clarity:
 *   import * as SecureStore from '@/platform/secureStore';
 *   import { Ionicons } from '@/platform/icons';
 *
 * Or use this barrel:
 *   import { appConfig, createAudioPlayer } from '@/platform';
 */

export type { AudioPlayer } from './audio';
export * as Audio from './audio';
export { appConfig, Constants, getPublicEnv, PUBLIC_ENV_PREFIX } from './constants';
export * as Crypto from './crypto';
export * as FileSystem from './filesystem';
export * as Haptics from './haptics';
export { Ionicons } from './icons';
export * as Notifications from './notifications';
export * as SecureStore from './secureStore';
export * as Sharing from './sharing';
export * as SplashScreen from './splash';
export type { SQLiteDatabase } from './sqlite';
export * as SQLite from './sqlite';
export type { StatusBarProps, StatusBarStyle } from './statusBar';
export { StatusBar } from './statusBar';
export type { WebBrowserAuthSessionResult } from './webBrowser';
export * as WebBrowser from './webBrowser';
