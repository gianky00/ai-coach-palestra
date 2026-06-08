import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import { Database } from '../types/database.types';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

// Preferiamo i valori definiti in app.json (extra) se presenti
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl &&
  Constants.expoConfig.extra.supabaseUrl !== 'YOUR_SUPABASE_URL'
    ? Constants.expoConfig.extra.supabaseUrl
    : 'https://ekckzmihqswqfglowpwk.supabase.co';

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey &&
  Constants.expoConfig.extra.supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
    ? Constants.expoConfig.extra.supabaseAnonKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrY2t6bWlocXN3cWZnbG93cHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODIxODQsImV4cCI6MjA5NDc1ODE4NH0.J5X5nqgG8NV15GBMdf5Woz03WtcNW5t1r7N6-eB_zd8';

console.log('[Supabase] Inizializzazione client con URL:', supabaseUrl);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
