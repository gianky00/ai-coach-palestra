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
import { colors, hitSlop, radius, space } from '../../theme';

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
    if (!user || savingClientId || loading) return;
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
          accessibilityLabel="Chiudi Garmin Connect"
          disabled={loading || savingClientId}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <View style={styles.content} testID="modal-garmin">
            <View style={styles.header}>
              <Ionicons name="watch-outline" size={32} color={colors.accent} />
              <Text style={styles.title}>Garmin Connect</Text>
              <Pressable
                testID="garmin-close-button"
                onPress={handleRequestClose}
                hitSlop={hitSlop}
                disabled={loading || savingClientId}
                accessibilityRole="button"
                accessibilityLabel="Chiudi"
                accessibilityState={{ disabled: loading || savingClientId }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
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
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !savingClientId && !isLinked}
              accessibilityLabel="Client ID Garmin"
            />
            {!isLinked && (
              <Pressable
                testID="garmin-save-client-id-button"
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  savingClientId && styles.disabled,
                  pressed && !savingClientId && styles.pressed,
                ]}
                onPress={() => {
                  void handleSaveClientId();
                }}
                disabled={savingClientId || loading}
                accessibilityRole="button"
                accessibilityLabel="Salva Client ID"
                accessibilityState={{ disabled: savingClientId || loading, busy: savingClientId }}
              >
                <Text style={styles.secondaryBtnText}>
                  {savingClientId ? 'Salvataggio…' : 'Salva Client ID'}
                </Text>
              </Pressable>
            )}

            <View
              style={styles.statusRow}
              accessibilityLabel={`Stato Garmin: ${statusLabel(linkStatus)}`}
            >
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
              <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
            ) : isLinked ? (
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  onPress={() => {
                    void handleSync();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Sincronizza ora"
                >
                  <Text style={styles.primaryBtnText}>SINCRONIZZA ORA</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  onPress={() => {
                    void handleDisconnect();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Disconnetti Garmin"
                >
                  <Text style={[styles.secondaryBtnText, styles.dangerText]}>Disconnetti</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={() => {
                  void handleConnect();
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  linkStatus === 'needs_reconnect'
                    ? clientId.trim()
                      ? 'Ricollega Garmin'
                      : 'Ricollega in modalità demo'
                    : clientId.trim()
                      ? 'Collega Garmin'
                      : 'Avvia demo Garmin'
                }
              >
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
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.xl,
  },
  keyboardWrap: {
    zIndex: 1,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.lg,
  },
  title: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900' },
  desc: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: space.xl },
  fieldLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: space.sm,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: space.md,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    marginBottom: space.xxl,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textFaint },
  statusDotActive: { backgroundColor: colors.accent },
  statusDotDemo: { backgroundColor: colors.warning },
  statusDotWarn: { backgroundColor: '#ff8844' },
  statusText: { color: colors.text, fontWeight: '700' },
  actions: { gap: space.md },
  primaryBtn: {
    backgroundColor: colors.accent,
    padding: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.accentOn, fontWeight: '900' },
  secondaryBtn: {
    padding: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  secondaryBtnText: { color: colors.text, fontWeight: '700' },
  dangerText: { color: colors.danger },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.88 },
});
