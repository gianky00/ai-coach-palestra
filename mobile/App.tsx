import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import NetInfo from '@react-native-community/netinfo';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  focusManager,
  onlineManager,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingModal } from './src/components/modals/OnboardingModal';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { FloatingTimer } from './src/components/ui/FloatingTimer';
import { AnalyticsView } from './src/components/views/AnalyticsView';
import { AuthView } from './src/components/views/AuthView';
import { HistoryView } from './src/components/views/HistoryView';
import { OggiView } from './src/components/views/OggiView';
import { ProfileView } from './src/components/views/ProfileView';
import { useAuth } from './src/hooks/useAuth';
import { AuthProvider } from './src/lib/AuthProvider';
import { queryClient } from './src/lib/queryClient';
import { setSmokeModeFlag } from './src/lib/sentry';
import { SmokeProvider } from './src/lib/SmokeContext';
import {
  isSmokeActive,
  parseSmokeUrl,
  SMOKE_TAB_ROUTES,
  type SmokeMode,
  type SmokeTab,
} from './src/lib/smokeMode';
import {
  SmokeSeedStatusBar,
  smokeSeedStatusFromMode,
  useSmokeSeedEffect,
} from './src/lib/SmokeSeedRuntime';
import { initDb } from './src/lib/sqlite';
import { Ionicons } from './src/platform/icons';
import * as SplashScreen from './src/platform/splash';
import { StatusBar } from './src/platform/statusBar';
import { notificationService } from './src/services/notificationService';
import { profileService } from './src/services/profileService';
import { useStore } from './src/store/useStore';
import { useTimerStore } from './src/store/useTimerStore';
import { colors, radius, space } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignoring error */
});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  });
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

const Tab = createBottomTabNavigator();

const DbErrorScreen = ({ onRetry }: { onRetry: () => void }) => (
  <View style={dbErrorStyles.container}>
    <Ionicons name="server-outline" size={48} color={colors.danger} />
    <Text style={dbErrorStyles.title}>Database locale non disponibile</Text>
    <Text style={dbErrorStyles.message}>
      I dati offline non possono essere salvati. Verifica lo spazio disponibile e riprova.
    </Text>
    <Pressable
      testID="db-error-retry-button"
      style={({ pressed }) => [dbErrorStyles.button, pressed && { opacity: 0.88 }]}
      onPress={onRetry}
      accessibilityRole="button"
    >
      <Text style={dbErrorStyles.buttonText}>RIPROVA</Text>
    </Pressable>
  </View>
);

const SmokeBanner = () => (
  <View testID="smoke-mode-banner" accessibilityLabel="SMOKE" style={smokeStyles.banner}>
    <Text style={smokeStyles.bannerText}>SMOKE</Text>
  </View>
);

const TabNavigator = ({ initialTab }: { initialTab?: SmokeTab }) => {
  const initialRouteName = initialTab ? SMOKE_TAB_ROUTES[initialTab] : undefined;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        key={initialTab ? `smoke-${initialTab}` : 'tabs'}
        initialRouteName={initialRouteName}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            paddingBottom: 6,
            paddingTop: 6,
            height: 62,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarIcon: ({ color, size }) => {
            let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'help-circle';
            if (route.name === 'Oggi') iconName = 'calendar';
            else if (route.name === 'Storico') iconName = 'time';
            else if (route.name === 'Analisi') iconName = 'stats-chart';
            else if (route.name === 'Profilo') iconName = 'person';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Oggi"
          component={OggiView}
          options={{ tabBarButtonTestID: 'tab-oggi', tabBarAccessibilityLabel: 'Oggi' }}
        />
        <Tab.Screen
          name="Storico"
          component={HistoryView}
          options={{ tabBarButtonTestID: 'tab-storico', tabBarAccessibilityLabel: 'Storico' }}
        />
        <Tab.Screen
          name="Analisi"
          component={AnalyticsView}
          options={{ tabBarButtonTestID: 'tab-analisi', tabBarAccessibilityLabel: 'Analisi' }}
        />
        <Tab.Screen
          name="Profilo"
          component={ProfileView}
          options={{ tabBarButtonTestID: 'tab-profilo', tabBarAccessibilityLabel: 'Profilo' }}
        />
      </Tab.Navigator>
      <FloatingTimer />
    </View>
  );
};

const AuthenticatedApp = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: () => profileService.fetchUserSettings(),
    enabled: !!user,
  });

  const needsOnboarding = !settingsLoading && (!settings || !settings.onboarding_completed);

  return (
    <>
      <TabNavigator />
      <OnboardingModal
        visible={needsOnboarding && !!user?.id}
        userId={user?.id ?? ''}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['user_settings'] });
        }}
      />
    </>
  );
};

const MainSwitcher = ({
  smokeMode,
  setSmokeMode,
}: {
  smokeMode: SmokeMode;
  setSmokeMode: React.Dispatch<React.SetStateAction<SmokeMode>>;
}) => {
  const { session, loading: authLoading } = useAuth();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [dbRetryKey, setDbRetryKey] = useState(0);
  const startTimer = useTimerStore((s) => s.startTimer);
  const stopTimer = useTimerStore((s) => s.stopTimer);
  useSmokeSeedEffect(smokeMode, setSmokeMode, dbReady);

  useEffect(() => {
    let cancelled = false;

    initDb()
      .then(() => {
        if (!cancelled) {
          setDbError(false);
          setDbReady(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (__DEV__) console.error('Errore critico SQLite:', err);
          setDbError(true);
          setDbReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dbRetryKey]);

  const smokeActive = isSmokeActive(smokeMode);

  useEffect(() => {
    // Smoke deep-links must not wait on Supabase auth (can hang offline).
    if (dbReady && (!authLoading || smokeActive)) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [dbReady, authLoading, smokeActive]);

  // Smoke timer: show FloatingTimer ±15 without logging a set.
  // Depend on kind/timerSeconds only — full smokeMode identity churn (seedStatus)
  // was cleanup-stopping the timer before ops could see timer-rest-presets.
  // Wait for dbReady so TabNavigator/FloatingTimer is mounted when isActive flips.
  const smokeTimerSeconds = smokeMode.kind === 'tabs' ? smokeMode.timerSeconds : undefined;
  useEffect(() => {
    if (!dbReady) return;
    if (smokeTimerSeconds) {
      startTimer(smokeTimerSeconds);
      return undefined;
    }
    stopTimer();
    return undefined;
  }, [dbReady, smokeTimerSeconds, startTimer, stopTimer]);

  // Must paint a frame or AndroidX splash stays forever even after keepSplash=false.
  if (!dbReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} testID="app-boot-placeholder" />;
  }

  if (dbError) {
    return <DbErrorScreen onRetry={() => setDbRetryKey((k) => k + 1)} />;
  }

  // Local adb verify: force Auth or Tabs without login / Garmin / onboarding.
  // Do not gate on authLoading — smoke must render for Pixel_9a UI verify.
  if (smokeMode.kind === 'auth') {
    return (
      <View style={{ flex: 1 }}>
        <SmokeBanner />
        <AuthView />
      </View>
    );
  }

  if (smokeMode.kind === 'seed' || smokeMode.kind === 'clear' || smokeMode.kind === 'tabs') {
    const tab = smokeMode.kind === 'tabs' ? smokeMode.tab : 'oggi';
    return (
      <View style={{ flex: 1 }}>
        <SmokeBanner />
        <SmokeSeedStatusBar status={smokeSeedStatusFromMode(smokeMode)} />
        <TabNavigator initialTab={tab} />
      </View>
    );
  }

  if (authLoading) {
    return null;
  }

  return session ? <AuthenticatedApp /> : <AuthView />;
};

export default function App() {
  const [smokeMode, setSmokeMode] = useState<SmokeMode>({ kind: 'off' });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (useStore.getState().notificationsEnabled && !isSmokeActive(smokeMode)) {
      notificationService.requestPermission();
    }
  }, [smokeMode]);

  useEffect(() => {
    setSmokeModeFlag(isSmokeActive(smokeMode));
  }, [smokeMode]);

  useEffect(() => {
    let mounted = true;

    const applyUrl = (url: string | null) => {
      const next = parseSmokeUrl(url);
      if (mounted && next.kind !== 'off') {
        setSmokeMode(next);
      }
    };

    Linking.getInitialURL()
      .then(applyUrl)
      .catch(() => {
        /* ignore */
      });

    const sub = Linking.addEventListener('url', ({ url }) => applyUrl(url));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <SmokeProvider mode={smokeMode}>
                <NavigationContainer
                  theme={{
                    dark: true,
                    colors: {
                      primary: colors.accent,
                      background: colors.bg,
                      card: colors.surface,
                      text: colors.text,
                      border: colors.border,
                      notification: colors.accent,
                    },
                    fonts: {
                      regular: { fontFamily: 'System', fontWeight: '400' },
                      medium: { fontFamily: 'System', fontWeight: '500' },
                      bold: { fontFamily: 'System', fontWeight: '700' },
                      heavy: { fontFamily: 'System', fontWeight: '800' },
                    },
                  }}
                >
                  <MainSwitcher smokeMode={smokeMode} setSmokeMode={setSmokeMode} />
                  <StatusBar style="light" backgroundColor={colors.bg} />
                </NavigationContainer>
              </SmokeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const dbErrorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xxxl,
    gap: space.lg,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: space.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: space.xxxl,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
  buttonText: { color: colors.accentOn, fontWeight: '900', fontSize: 14 },
});

const smokeStyles = StyleSheet.create({
  banner: {
    backgroundColor: colors.accentMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingVertical: 4,
    alignItems: 'center',
  },
  bannerText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
