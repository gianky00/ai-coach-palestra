import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'KineFit',
  slug: 'kinefit-elite',
  scheme: 'kinefit',
  version: '1.0.11',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#1a1a1a',
  primaryColor: '#00ff88',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1a1a1a',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.coemi.kinefit.elite',
    buildNumber: '12',
  },
  android: {
    package: 'com.coemi.kinefit.elite',
    versionCode: 12,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1a1a1a',
    },
  },
  web: {
    backgroundColor: '#1a1a1a',
  },
  plugins: [
    'expo-secure-store',
    'expo-sqlite',
    'expo-audio',
    'expo-asset',
    'expo-font',
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#00ff88',
      },
    ],
    [
      '@sentry/react-native',
      {
        organization: process.env.SENTRY_ORG ?? 'intelleo',
        project: process.env.SENTRY_PROJECT ?? 'kinefit',
      },
    ],
    'expo-web-browser',
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
    garminClientId: process.env.EXPO_PUBLIC_GARMIN_CLIENT_ID ?? '',
    eas: {
      projectId: '189a690e-e0f3-4f76-b554-95244e293d98',
    },
  },
});
