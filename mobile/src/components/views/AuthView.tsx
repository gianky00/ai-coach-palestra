import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../lib/utils';
import { appConfig } from '../../platform/constants';
import { KineFitLogo } from '../ui/KineFitLogo';

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthView = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const version = appConfig.version;

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Errore', 'La password deve avere almeno 6 caratteri');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) Alert.alert('Accesso fallito', error.message);
  };

  const handleRegister = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Errore', 'La password deve avere almeno 6 caratteri');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Registrazione fallita', error.message);
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
      Alert.alert('Errore', "Inserisci l'email associata al tuo account");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert('Errore', error.message);
    } else {
      Alert.alert('Email inviata', 'Controlla la tua casella per reimpostare la password.', [
        { text: 'OK', onPress: () => setMode('login') },
      ]);
    }
  };

  const handleSubmit = () => {
    if (mode === 'login') handleLogin();
    else if (mode === 'register') handleRegister();
    else handleForgotPassword();
  };

  const titles: Record<AuthMode, string> = {
    login: 'ACCEDI',
    register: 'REGISTRATI',
    forgot: 'RECUPERA PASSWORD',
  };

  return (
    <SafeAreaView style={styles.container} testID="screen-auth">
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <KineFitLogo size={120} />
          <Text style={styles.title} accessibilityLabel="KINEFIT">
            KINEFIT
          </Text>
          <Text style={styles.subtitle}>ELITE TRAINING MOBILE</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            testID="auth-tab-login"
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="auth-tab-register"
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
              Registrati
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            testID="auth-email-input"
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {mode !== 'forgot' && (
            <TextInput
              testID="auth-password-input"
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'register' ? 'new-password' : 'password'}
            />
          )}

          <TouchableOpacity
            testID="auth-submit-button"
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>{titles[mode]}</Text>
            )}
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity onPress={() => setMode('forgot')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Password dimenticata?</Text>
            </TouchableOpacity>
          )}

          {mode === 'forgot' && (
            <TouchableOpacity onPress={() => setMode('login')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Torna al login</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.footerText}>KineFit v{version}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 5, marginTop: 20 },
  subtitle: { fontSize: 12, color: '#00ff88', fontWeight: '800', letterSpacing: 2, marginTop: 5 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#252525',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  tabActive: { backgroundColor: '#00ff8833', borderColor: '#00ff88' },
  tabText: { color: '#888', fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: '#00ff88' },
  form: { gap: 15 },
  input: {
    backgroundColor: '#252525',
    color: '#fff',
    padding: 18,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#00ff88',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { fontWeight: '900', color: '#000', fontSize: 16 },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#00ff88', fontSize: 14, fontWeight: '600' },
  footerText: {
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    fontWeight: '700',
  },
});
