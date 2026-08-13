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
  StyleSheet,
  Text,
  TouchableOpacity,
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
import {
  isSmokeActive,
  parseSmokeUrl,
  SMOKE_TAB_ROUTES,
  type SmokeMode,
  type SmokeTab,
} from './src/lib/smokeMode';
import { initDb } from './src/lib/sqlite';
import { Ionicons } from './src/platform/icons';
import * as SplashScreen from './src/platform/splash';
import { StatusBar } from './src/platform/statusBar';
import { notificationService } from './src/services/notificationService';
import { profileService } from './src/services/profileService';
import { useStore } from './src/store/useStore';

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
    <Ionicons name="server-outline" size={48} color="#ff4444" />
    <Text style={dbErrorStyles.title}>Database locale non disponibile</Text>
    <Text style={dbErrorStyles.message}>
      I dati offline non possono essere salvati. Verifica lo spazio disponibile e riprova.
    </Text>
    <TouchableOpacity style={dbErrorStyles.button} onPress={onRetry}>
      <Text style={dbErrorStyles.buttonText}>RIPROVA</Text>
    </TouchableOpacity>
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
            backgroundColor: '#1a1a1a',
            borderTopColor: '#333',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarActiveTintColor: '#00ff88',
          tabBarInactiveTintColor: '#888',
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
        <Tab.Screen name="Oggi" component={OggiView} options={{ tabBarButtonTestID: 'tab-oggi' }} />
        <Tab.Screen
          name="Storico"
          component={HistoryView}
          options={{ tabBarButtonTestID: 'tab-storico' }}
        />
        <Tab.Screen
          name="Analisi"
          component={AnalyticsView}
          options={{ tabBarButtonTestID: 'tab-analisi' }}
        />
        <Tab.Screen
          name="Profilo"
          component={ProfileView}
          options={{ tabBarButtonTestID: 'tab-profilo' }}
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

const MainSwitcher = ({ smokeMode }: { smokeMode: SmokeMode }) => {
  const { session, loading: authLoading } = useAuth();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [dbRetryKey, setDbRetryKey] = useState(0);

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

  useEffect(() => {
    if (dbReady && !authLoading) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [dbReady, authLoading]);

  if (authLoading || !dbReady) {
    return null;
  }

  if (dbError) {
    return <DbErrorScreen onRetry={() => setDbRetryKey((k) => k + 1)} />;
  }

  // Local adb verify: force Auth or Tabs without login / Garmin / onboarding.
  if (smokeMode.kind === 'auth') {
    return (
      <View style={{ flex: 1 }}>
        <SmokeBanner />
        <AuthView />
      </View>
    );
  }

  if (smokeMode.kind === 'tabs') {
    return (
      <View style={{ flex: 1 }}>
        <SmokeBanner />
        <TabNavigator initialTab={smokeMode.tab} />
      </View>
    );
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
              <NavigationContainer
                theme={{
                  dark: true,
                  colors: {
                    primary: '#00ff88',
                    background: '#1a1a1a',
                    card: '#1a1a1a',
                    text: '#ffffff',
                    border: '#333333',
                    notification: '#00ff88',
                  },
                  fonts: {
                    regular: { fontFamily: 'System', fontWeight: '400' },
                    medium: { fontFamily: 'System', fontWeight: '500' },
                    bold: { fontFamily: 'System', fontWeight: '700' },
                    heavy: { fontFamily: 'System', fontWeight: '800' },
                  },
                }}
              >
                <MainSwitcher smokeMode={smokeMode} />
                <StatusBar style="light" />
              </NavigationContainer>
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
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 16,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  message: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  button: {
    marginTop: 10,
    backgroundColor: '#00ff88',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 14 },
});

const smokeStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#00ff8822',
    borderBottomWidth: 1,
    borderBottomColor: '#00ff88',
    paddingVertical: 4,
    alignItems: 'center',
  },
  bannerText: {
    color: '#00ff88',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
