import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, AppStateStatus, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FloatingTimer } from './src/components/ui/FloatingTimer';
import { AnalyticsView } from './src/components/views/AnalyticsView';
import { AuthView } from './src/components/views/AuthView';
import { HistoryView } from './src/components/views/HistoryView';
import { OggiView } from './src/components/views/OggiView';
import { ProfileView } from './src/components/views/ProfileView';
import { useAuth } from './src/hooks/useAuth';
import { AuthProvider } from './src/lib/AuthProvider';
import { initDb } from './src/lib/sqlite';

// Mantieni visibile la Splash Screen finché i dati/db non sono pronti
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignoring error */
});

// Configurazione OnlineManager per tolleranza cadute di rete (React Query)
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  });
});

// Configurazione FocusManager per refetch all'apertura app (React Query)
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

const TabNavigator = () => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
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
            let iconName: keyof typeof Ionicons.glyphMap;
            if (route.name === 'Oggi') iconName = 'calendar';
            else if (route.name === 'Storico') iconName = 'time';
            else if (route.name === 'Analisi') iconName = 'stats-chart';
            else if (route.name === 'Profilo') iconName = 'person';
            else iconName = 'help-circle';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Oggi" component={OggiView} />
        <Tab.Screen name="Storico" component={HistoryView} />
        <Tab.Screen name="Analisi" component={AnalyticsView} />
        <Tab.Screen name="Profilo" component={ProfileView} />
      </Tab.Navigator>
      <FloatingTimer />
    </View>
  );
};

const MainSwitcher = () => {
  const { session, loading: authLoading } = useAuth();
  const [dbReady, setDbReady] = React.useState(false);

  useEffect(() => {
    initDb()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('Errore critico SQLite:', err);
        setDbReady(true);
      });
  }, []);

  // Chiude la Splash Screen quando TUTTO è pronto
  useEffect(() => {
    if (dbReady && !authLoading) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [dbReady, authLoading]);

  if (authLoading || !dbReady) {
    // Restituisce null per mantenere la view trasparente dietro la Splash Screen nativa
    return null;
  }

  return session ? <TabNavigator /> : <AuthView />;
};

export default function App() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
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
            <MainSwitcher />
            <StatusBar style="light" />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
