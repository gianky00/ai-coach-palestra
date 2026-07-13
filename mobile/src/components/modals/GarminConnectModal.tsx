import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { garminService } from '../../services/garminService';
import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';

interface GarminConnectModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GarminConnectModal: React.FC<GarminConnectModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: () => profileService.fetchUserSettings(),
    enabled: !!user && visible,
  });

  const isConnected = settings?.garmin_connected ?? false;

  const handleConnect = async () => {
    if (!user) return;
    setLoading(true);
    hapticService.medium();
    const { error } = await garminService.connect(user.id);
    setLoading(false);
    if (error) {
      hapticService.error();
    } else {
      hapticService.success();
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await garminService.disconnect(user.id);
    setLoading(false);
    if (!error) {
      hapticService.success();
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    }
  };

  const handleSync = async () => {
    setLoading(true);
    await garminService.showSyncResult();
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <View style={styles.header}>
                <Ionicons name="watch-outline" size={32} color="#00ff88" />
                <Text style={styles.title}>Garmin Connect</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.desc}>
                Collega il tuo account Garmin per sincronizzare attività cardio e monitorare il
                recupero. Senza Client ID configurato, viene usata la modalità demo.
              </Text>

              <View style={styles.statusRow}>
                <View style={[styles.statusDot, isConnected && styles.statusDotActive]} />
                <Text style={styles.statusText}>{isConnected ? 'Connesso' : 'Non connesso'}</Text>
              </View>

              {loading ? (
                <ActivityIndicator color="#00ff88" style={{ marginVertical: 20 }} />
              ) : isConnected ? (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSync}>
                    <Text style={styles.primaryBtnText}>SINCRONIZZA ORA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={handleDisconnect}>
                    <Text style={styles.secondaryBtnText}>Disconnetti</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.primaryBtn} onPress={handleConnect}>
                  <Text style={styles.primaryBtnText}>COLLEGA GARMIN</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#444' },
  statusDotActive: { backgroundColor: '#00ff88' },
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
  },
  secondaryBtnText: { color: '#ff4444', fontWeight: '700' },
});
