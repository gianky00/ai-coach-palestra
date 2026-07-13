import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';
import { GarminConnectModal } from '../modals/GarminConnectModal';
import { SettingsModal } from '../modals/SettingsModal';

export const ProfileView = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showGarmin, setShowGarmin] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  const version = Constants.expoConfig?.version || '1.0.0';
  const build = Constants.expoConfig?.android?.versionCode || '1';

  const {
    data: bodyWeight,
    isRefetching,
    refetch: refetchWeight,
  } = useQuery({
    queryKey: ['biometrics', 'latest', user?.id],
    queryFn: () => profileService.fetchLatestWeight(),
    enabled: !!user,
  });

  const displayWeight = bodyWeight != null ? String(bodyWeight) : '--';

  const onRefresh = async () => {
    await refetchWeight();
    await queryClient.invalidateQueries({ queryKey: ['user_settings'] });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Vuoi davvero uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: signOut },
    ]);
  };

  const openWeightModal = () => {
    setWeightInput(bodyWeight != null ? String(bodyWeight) : '');
    setShowWeightModal(true);
  };

  const saveWeight = async () => {
    if (!user) return;
    const parsed = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
      Alert.alert('Errore', 'Inserisci un peso valido (1–500 kg)');
      return;
    }

    setSavingWeight(true);
    const { error } = await profileService.saveWeight(user.id, parsed);
    setSavingWeight(false);

    if (error) {
      Alert.alert('Errore', 'Impossibile salvare il peso');
      return;
    }

    hapticService.success();
    setShowWeightModal(false);
    await refetchWeight();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#00ff88" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profilo</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.status}>Membro Premium Elite</Text>

          <View style={styles.weightBadge}>
            <TouchableOpacity style={styles.weightContent} onPress={openWeightModal}>
              <Ionicons name="scale-outline" size={16} color="#00ff88" />
              <Text style={styles.weightText}>{displayWeight} kg</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowGarmin(true)}>
            <Ionicons name="watch-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Garmin Connect</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Impostazioni</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ff4444" />
            <Text style={[styles.menuText, { color: '#ff4444' }]}>Esci dall'account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            KineFit v{version} (Build {build})
          </Text>
        </View>
      </ScrollView>

      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
      <GarminConnectModal visible={showGarmin} onClose={() => setShowGarmin(false)} />

      <Modal visible={showWeightModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aggiorna Peso</Text>
            <Text style={styles.modalDesc}>Inserisci il tuo peso corporeo attuale (kg)</Text>
            <TextInput
              style={styles.modalInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder="75"
              placeholderTextColor="#666"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowWeightModal(false)}
                disabled={savingWeight}
              >
                <Text style={styles.modalCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, savingWeight && styles.disabled]}
                onPress={saveWeight}
                disabled={savingWeight}
              >
                <Text style={styles.modalSaveText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { padding: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff' },
  profileCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#252525',
    margin: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00ff88',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#000' },
  email: { color: '#fff', fontSize: 18, fontWeight: '700' },
  status: { color: '#888', fontSize: 14, marginTop: 5 },
  weightBadge: {
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  weightContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weightText: { color: '#00ff88', fontWeight: '800', fontSize: 14 },
  menu: { paddingHorizontal: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#252525',
    borderRadius: 20,
    marginBottom: 12,
    gap: 15,
  },
  menuText: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: { marginTop: 20, borderColor: '#ff444433', borderWidth: 1 },
  versionContainer: { alignItems: 'center', marginTop: 30, marginBottom: 40 },
  versionText: { color: '#666', fontSize: 12, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#252525',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalDesc: { color: '#888', fontSize: 14, marginBottom: 20 },
  modalInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    padding: 16,
    borderRadius: 12,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  modalCancelText: { color: '#aaa', fontWeight: '700' },
  modalSave: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#00ff88',
  },
  modalSaveText: { color: '#000', fontWeight: '900' },
  disabled: { opacity: 0.5 },
});
