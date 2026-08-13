import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '../../platform/icons';
import { type GarminLinkStatus, garminService } from '../../services/garminService';
import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';

interface GarminConnectModalProps {
  visible: boolean;
  onClose: () => void;
}

const statusLabel = (status: GarminLinkStatus): string => {
  switch (status) {
    case 'demo':
      return 'Demo';
    case 'connected':
      return 'Connesso';
    case 'needs_reconnect':
      return 'Riconnessione richiesta';
    default:
      return 'Non connesso';
  }
};

export const GarminConnectModal: React.FC<GarminConnectModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [savingClientId, setSavingClientId] = useState(false);
  const [linkStatus, setLinkStatus] = useState<GarminLinkStatus>('disconnected');

  const { data: settings } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: () => profileService.fetchUserSettings(),
    enabled: !!user && visible,
  });

  const refreshLinkStatus = async () => {
    if (!user) {
      setLinkStatus('disconnected');
      return;
    }
    const status = await garminService.getLinkStatus(user.id, settings?.garmin_connected);
    setLinkStatus(status);
  };

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      if (!user) return;
      const stored = await garminService.getClientId(user.id);
      if (!cancelled) setClientId(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, user]);

  useEffect(() => {
    if (!visible || !user) return;
    let cancelled = false;
    (async () => {
      const status = await garminService.getLinkStatus(user.id, settings?.garmin_connected);
      if (!cancelled) setLinkStatus(status);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, user, settings?.garmin_connected]);

  const isLinked = linkStatus === 'demo' || linkStatus === 'connected';
  const statusActive = isLinked;

  const handleSaveClientId = async () => {
    if (!user) return;
    setSavingClientId(true);
    hapticService.light();
    try {
      await garminService.setClientId(clientId, user.id);
      hapticService.success();
    } catch {
      hapticService.error();
      Alert.alert('Garmin Connect', 'Impossibile salvare il Client ID.');
    } finally {
      setSavingClientId(false);
    }
  };

  const handleConnect = async () => {
    if (!user || loading) return;
    setLoading(true);
    hapticService.medium();
    try {
      if (clientId.trim()) {
        await garminService.setClientId(clientId, user.id);
      } else {
        await garminService.setClientId('', user.id);
      }
      const { error } = await garminService.connect(user.id);
      if (error) {
        hapticService.error();
        Alert.alert('Garmin Connect', error.message);
      } else {
        hapticService.success();
        queryClient.invalidateQueries({ queryKey: ['user_settings'] });
        await refreshLinkStatus();
      }
    } catch (err) {
      hapticService.error();
      Alert.alert(
        'Garmin Connect',
        err instanceof Error ? err.message : 'Errore durante la connessione.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const { error } = await garminService.disconnect(user.id);
      if (error) {
        hapticService.error();
        Alert.alert('Garmin Connect', error.message);
      } else {
        hapticService.success();
        queryClient.invalidateQueries({ queryKey: ['user_settings'] });
        await refreshLinkStatus();
      }
    } catch (err) {
      hapticService.error();
      Alert.alert(
        'Garmin Connect',
        err instanceof Error ? err.message : 'Errore durante la disconnessione.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const result = await garminService.syncActivities(user.id);
      Alert.alert('Garmin Connect', result.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClose = () => {
    if (loading || savingClientId) return;
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleRequestClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleRequestClose}
          accessibilityRole="button"
          disabled={loading || savingClientId}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Ionicons name="watch-outline" size={32} color="#00ff88" />
              <Text style={styles.title}>Garmin Connect</Text>
              <Pressable
                onPress={handleRequestClose}
                hitSlop={12}
                disabled={loading || savingClientId}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <Text style={styles.desc}>
              Senza Client ID: modalità demo locale. Con Client ID: OAuth2 PKCE verso Garmin (token
              scambiati lato server; richiede edge function `garmin` e secrets configurati).
            </Text>

            <Text style={styles.fieldLabel}>Client ID Garmin (opzionale)</Text>
            <TextInput
              style={styles.input}
              value={clientId}
              onChangeText={setClientId}
              placeholder="Consumer Key Garmin (opzionale)"
              placeholderTextColor="#555"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !savingClientId && !isLinked}
            />
            {!isLinked && (
              <Pressable
                style={[styles.secondaryBtn, savingClientId && styles.disabled]}
                onPress={handleSaveClientId}
                disabled={savingClientId || loading}
              >
                <Text style={styles.secondaryBtnText}>
                  {savingClientId ? 'Salvataggio…' : 'Salva Client ID'}
                </Text>
              </Pressable>
            )}

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  statusActive && styles.statusDotActive,
                  linkStatus === 'demo' && styles.statusDotDemo,
                  linkStatus === 'needs_reconnect' && styles.statusDotWarn,
                ]}
              />
              <Text style={styles.statusText}>{statusLabel(linkStatus)}</Text>
            </View>

            {loading ? (
              <ActivityIndicator color="#00ff88" style={{ marginVertical: 20 }} />
            ) : isLinked ? (
              <View style={styles.actions}>
                <Pressable style={styles.primaryBtn} onPress={handleSync}>
                  <Text style={styles.primaryBtnText}>SINCRONIZZA ORA</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={handleDisconnect}>
                  <Text style={[styles.secondaryBtnText, styles.dangerText]}>Disconnetti</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.primaryBtn} onPress={handleConnect}>
                <Text style={styles.primaryBtnText}>
                  {linkStatus === 'needs_reconnect'
                    ? clientId.trim()
                      ? 'RICOLLEGA GARMIN'
                      : 'RICOLLEGA (DEMO)'
                    : clientId.trim()
                      ? 'COLLEGA GARMIN'
                      : 'AVVIA DEMO'}
                </Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  keyboardWrap: {
    zIndex: 1,
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '900' },
  desc: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  fieldLabel: {
    color: '#00ff88',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#444' },
  statusDotActive: { backgroundColor: '#00ff88' },
  statusDotDemo: { backgroundColor: '#ffcc00' },
  statusDotWarn: { backgroundColor: '#ff8844' },
  statusText: { color: '#fff', fontWeight: '700' },
  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#000', fontWeight: '900' },
  secondaryBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 4,
  },
  secondaryBtnText: { color: '#fff', fontWeight: '700' },
  dangerText: { color: '#ff4444' },
  disabled: { opacity: 0.5 },
});
