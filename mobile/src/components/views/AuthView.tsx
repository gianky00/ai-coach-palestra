import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../lib/utils';
import { appConfig } from '../../platform/constants';
import { colors, hitSlop, radius, space, typography } from '../../theme';
import { Button } from '../ui/Button';
import { KineFitLogo } from '../ui/KineFitLogo';
import { Screen } from '../ui/Screen';

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthView = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const version = appConfig.version;

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Email non valida', 'Inserisci un indirizzo email valido per continuare.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password troppo corta', 'Usa almeno 6 caratteri.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert(
        'Accesso non riuscito',
        error.message || 'Controlla email e password, poi riprova.',
      );
    }
  };

  const handleRegister = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Email non valida', 'Inserisci un indirizzo email valido per continuare.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password troppo corta', 'Usa almeno 6 caratteri.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert(
        'Registrazione non riuscita',
        error.message || 'Riprova tra poco. Se persiste, verifica la connessione.',
      );
    } else {
      Alert.alert(
        'Account creato',
        'Controlla la tua email per confermare la registrazione, poi accedi.',
        [{ text: 'OK', onPress: () => setMode('login') }],
      );
    }
  };

  const handleForgotPassword = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Email richiesta', 'Inserisci l’email associata al tuo account.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert(
        'Recupero non riuscito',
        error.message || 'Non siamo riusciti a inviare l’email. Riprova.',
      );
    } else {
      Alert.alert('Email inviata', 'Controlla la tua casella per reimpostare la password.', [
        { text: 'OK', onPress: () => setMode('login') },
      ]);
    }
  };

  const handleSubmit = () => {
    if (loading) return;
    if (mode === 'login') void handleLogin();
    else if (mode === 'register') void handleRegister();
    else void handleForgotPassword();
  };

  const titles: Record<AuthMode, string> = {
    login: 'ACCEDI',
    register: 'REGISTRATI',
    forgot: 'RECUPERA PASSWORD',
  };

  return (
    <Screen testID="screen-auth" edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.brandBlock}>
            <View style={styles.logoGlow}>
              <KineFitLogo size={112} />
            </View>
            <Text style={styles.title} accessibilityLabel="KINEFIT">
              KINEFIT
            </Text>
            <Text style={styles.subtitle}>ELITE TRAINING</Text>
          </View>

          <View style={styles.tabRow} accessibilityRole="tablist">
            <Pressable
              testID="auth-tab-login"
              accessibilityRole="tab"
              accessibilityLabel="Accedi"
              accessibilityState={{ selected: mode === 'login' }}
              hitSlop={hitSlop}
              style={({ pressed }) => [
                styles.tab,
                mode === 'login' && styles.tabActive,
                pressed && styles.pressedSoft,
              ]}
              onPress={() => !loading && setMode('login')}
              disabled={loading}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Login</Text>
            </Pressable>
            <Pressable
              testID="auth-tab-register"
              accessibilityRole="tab"
              accessibilityLabel="Registrati"
              accessibilityState={{ selected: mode === 'register' }}
              hitSlop={hitSlop}
              style={({ pressed }) => [
                styles.tab,
                mode === 'register' && styles.tabActive,
                pressed && styles.pressedSoft,
              ]}
              onPress={() => !loading && setMode('register')}
              disabled={loading}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                Registrati
              </Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <TextInput
              testID="auth-email-input"
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textDim}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Email"
            />
            {mode !== 'forgot' && (
              <TextInput
                testID="auth-password-input"
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'register' ? 'new-password' : 'password'}
                accessibilityLabel="Password"
              />
            )}

            <Button
              testID="auth-submit-button"
              title={titles[mode]}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submit}
            />

            {mode === 'login' && (
              <Button
                testID="auth-forgot-button"
                variant="ghost"
                title="Password dimenticata?"
                onPress={() => setMode('forgot')}
              />
            )}

            {mode === 'forgot' && (
              <Button
                testID="auth-back-to-login-button"
                variant="ghost"
                title="Torna al login"
                onPress={() => setMode('login')}
              />
            )}

            <Text style={styles.footerText}>KineFit v{version}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: space.xxxl,
    paddingVertical: space.xxl,
    justifyContent: 'center',
  },
  brandBlock: { alignItems: 'center', marginBottom: space.xxxl },
  logoGlow: {
    padding: space.md,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  title: {
    ...typography.hero,
    color: colors.text,
    letterSpacing: 6,
    marginTop: space.xl,
  },
  subtitle: {
    ...typography.overline,
    color: colors.accent,
    marginTop: space.sm,
  },
  tabRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.xl },
  tab: {
    flex: 1,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  tabText: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: colors.accent },
  form: { gap: space.md },
  input: {
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submit: { marginTop: space.sm },
  pressedSoft: { opacity: 0.9 },
  footerText: {
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: space.lg,
    fontSize: 12,
    fontWeight: '700',
  },
});
