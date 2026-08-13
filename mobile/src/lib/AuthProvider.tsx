import { Session, User } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';

import { setSentryUser } from '../lib/sentry';
import { supabase } from '../lib/supabase';
import { garminService } from '../services/garminService';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const syncSentryUser = (user: User | null) => {
    setSentryUser(user ? { id: user.id } : null);
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    try {
      supabase.auth
        .getSession()
        .then(({ data: { session: currentSession } }) => {
          if (cancelled) return;
          setSession(currentSession);
          syncSentryUser(currentSession?.user ?? null);
          setLoading(false);
        })
        .catch((err) => {
          if (__DEV__) console.error('[AuthProvider] getSession failed', err);
          if (!cancelled) setLoading(false);
        });

      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
        syncSentryUser(currentSession?.user ?? null);
      });
      subscription = sub;
    } catch (err) {
      if (__DEV__) console.error('[AuthProvider] supabase init failed', err);
      // Defer so we don't sync-setState inside the effect body (lint + cascading render).
      queueMicrotask(() => {
        if (!cancelled) setLoading(false);
      });
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const userId = session?.user?.id;
    if (userId) {
      try {
        await garminService.clearLocalCredentials(userId);
      } catch {
        // Non bloccare il logout se SecureStore fallisce
      }
    }
    await supabase.auth.signOut();
    setSentryUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
