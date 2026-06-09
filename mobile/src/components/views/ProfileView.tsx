import { Ionicons } from '@expo/vector-icons';
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
import { hapticService } from '../../services/soundService';
import { SettingsModal } from '../modals/SettingsModal';

export const ProfileView = () => {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('75');
  const [refreshing, setRefreshing] = useState(false);

  const version = Constants.expoConfig?.version || '1.0.0';
  const build = Constants.expoConfig?.android?.versionCode || '1';

  const onRefresh = () => {
    setRefreshing(true);
    // Simula refresh settings o refetch profilo
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Vuoi davvero uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: signOut },
    ]);
  };

  const updateWeight = () => {
    Alert.prompt(
      'Aggiorna Peso',
      'Inserisci il tuo peso corporeo attuale (kg):',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Salva',
          onPress: (val?: string) => {
            if (val) {
              setBodyWeight(val);
              hapticService.success();
            }
          },
        },
      ],
      'plain-text',
      bodyWeight,
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff88" />
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
            <TouchableOpacity style={styles.weightContent} onPress={updateWeight}>
              <Ionicons name="scale-outline" size={16} color="#00ff88" />
              <Text style={styles.weightText}>{bodyWeight} kg</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Impostazioni</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowSettings(true)}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Notifiche</Text>
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
});
