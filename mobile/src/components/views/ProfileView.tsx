import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../hooks/useAuth';
import { garminBadgeLabel, useGarminLinkStatus } from '../../hooks/useGarminLinkStatus';
import { profileService } from '../../services/profileService';
import { GarminConnectModal } from '../modals/GarminConnectModal';
import { ProfileEditModal } from '../modals/ProfileEditModal';
import { SettingsModal } from '../modals/SettingsModal';
import { WeightUpdateModal } from '../modals/WeightUpdateModal';

export const ProfileView = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showGarmin, setShowGarmin] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

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

  const { data: settings } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: () => profileService.fetchUserSettings(),
    enabled: !!user,
  });

  const garminStatus = useGarminLinkStatus(user?.id, settings?.garmin_connected, showGarmin);
  const displayWeight = bodyWeight != null ? String(bodyWeight) : '--';
  const garminBadge = garminBadgeLabel(garminStatus);

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
            <TouchableOpacity style={styles.weightContent} onPress={() => setShowWeightModal(true)}>
              <Ionicons name="scale-outline" size={16} color="#00ff88" />
              <Text style={styles.weightText}>{displayWeight} kg</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileStats}
          onPress={() => setShowProfileEdit(true)}
          activeOpacity={0.85}
        >
          <View style={styles.profileStatsHeader}>
            <Text style={styles.profileStatsTitle}>Dati profilo</Text>
            <Ionicons name="create-outline" size={18} color="#00ff88" />
          </View>
          <Text style={styles.profileStatLine}>
            Altezza: {settings?.height != null ? `${settings.height} cm` : '—'}
          </Text>
          <Text style={styles.profileStatLine}>
            Esperienza: {settings?.experience_level || '—'}
          </Text>
          <Text style={styles.profileStatLine}>Obiettivo: {settings?.primary_goal || '—'}</Text>
          <Text style={styles.profileStatLine}>
            Giorni/settimana:{' '}
            {settings?.training_days_per_week != null ? settings.training_days_per_week : '—'}
          </Text>
        </TouchableOpacity>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowGarmin(true)}>
            <Ionicons name="watch-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Garmin Connect</Text>
            {garminBadge ? <Text style={styles.menuBadge}>{garminBadge}</Text> : null}
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

      {user ? (
        <>
          <WeightUpdateModal
            visible={showWeightModal}
            userId={user.id}
            initialWeight={bodyWeight}
            onClose={() => setShowWeightModal(false)}
            onSaved={() => {
              void refetchWeight();
            }}
          />
          <ProfileEditModal
            visible={showProfileEdit}
            userId={user.id}
            settings={settings}
            onClose={() => setShowProfileEdit(false)}
            onSaved={() => {
              void queryClient.invalidateQueries({ queryKey: ['user_settings'] });
            }}
          />
        </>
      ) : null}
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
  profileStats: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    backgroundColor: '#252525',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    gap: 6,
  },
  profileStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileStatsTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  profileStatLine: { color: '#aaa', fontSize: 13, fontWeight: '600' },
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
  menuBadge: {
    color: '#ffcc00',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  logoutBtn: { marginTop: 20, borderColor: '#ff444433', borderWidth: 1 },
  versionContainer: { alignItems: 'center', marginTop: 30, marginBottom: 40 },
  versionText: { color: '#666', fontSize: 12, fontWeight: '500' },
});
