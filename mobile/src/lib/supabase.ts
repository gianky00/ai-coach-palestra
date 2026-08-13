import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { appConfig } from '../platform/constants';
import * as SecureStore from '../platform/secureStore';
import { Database } from '../types/database.types';

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

let client: SupabaseClient<Database> | null = null;

/** Lazy client — avoids throwing at import time in Vitest when env is absent. */
export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;

  const supabaseUrl = appConfig.supabaseUrl;
  const supabaseAnonKey = appConfig.supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase non configurato. Copia mobile/.env.example in mobile/.env e imposta KINEFIT_SUPABASE_URL e KINEFIT_SUPABASE_ANON_KEY.',
    );
  }

  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  if ((globalThis as { __DEV__?: boolean }).__DEV__) {
     
    console.log('[Supabase] Client inizializzato');
  }

  return client;
}

/** Backward-compatible export — resolves lazily on property access. */
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const real = getSupabase();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
