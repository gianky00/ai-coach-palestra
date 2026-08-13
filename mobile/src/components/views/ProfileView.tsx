import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { garminBadgeLabel, useGarminLinkStatus } from '../../hooks/useGarminLinkStatus';
import { appConfig } from '../../platform/constants';
import { Ionicons } from '../../platform/icons';
import { profileService } from '../../services/profileService';
import { colors, hitSlop, radius, space, type } from '../../theme';
import { GarminConnectModal } from '../modals/GarminConnectModal';
import { ProfileEditModal } from '../modals/ProfileEditModal';
import { SettingsModal } from '../modals/SettingsModal';
import { WeightUpdateModal } from '../modals/WeightUpdateModal';
import { Screen } from '../ui/Screen';

export const ProfileView = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showGarmin, setShowGarmin] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const version = appConfig.version;
  const build = appConfig.androidVersionCode || '1';

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
    <Screen testID="screen-profile">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profilo</Text>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email}
          </Text>
          <Pressable
            testID="profile-weight-badge"
            style={({ pressed }) => [styles.weightChip, pressed && styles.pressed]}
            onPress={() => setShowWeightModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`Peso ${displayWeight} kg`}
            hitSlop={hitSlop}
          >
            <Ionicons name="scale-outline" size={16} color={colors.accent} />
            <Text style={styles.weightText}>{displayWeight} kg</Text>
          </Pressable>
        </View>

        <Pressable
          testID="profile-edit-card"
          style={({ pressed }) => [styles.profileStats, pressed && styles.pressed]}
          onPress={() => setShowProfileEdit(true)}
          accessibilityRole="button"
          accessibilityLabel="Modifica dati profilo"
        >
          <View style={styles.profileStatsHeader}>
            <Text style={styles.profileStatsTitle}>Dati profilo</Text>
            <Ionicons name="create-outline" size={18} color={colors.accent} />
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
        </Pressable>

        <View style={styles.menu}>
          <Pressable
            testID="profile-garmin-row"
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={() => setShowGarmin(true)}
            accessibilityRole="button"
            accessibilityLabel="Garmin Connect"
          >
            <Ionicons name="watch-outline" size={22} color={colors.text} />
            <Text style={styles.menuText}>Garmin Connect</Text>
            {garminBadge ? <Text style={styles.menuBadge}>{garminBadge}</Text> : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>

          <Pressable
            testID="profile-settings-row"
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={() => setShowSettings(true)}
            accessibilityRole="button"
            accessibilityLabel="Impostazioni"
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
            <Text style={styles.menuText}>Impostazioni</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>

          <Pressable
            testID="profile-logout"
            style={({ pressed }) => [styles.menuItem, styles.logoutBtn, pressed && styles.pressed]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Esci dall'account"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={[styles.menuText, styles.logoutText]}>Esci dall'account</Text>
          </Pressable>
        </View>

        <Text style={styles.versionText}>
          KineFit v{version} · Build {build}
        </Text>
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  header: { paddingHorizontal: space.xl, paddingTop: space.sm },
  title: { ...type.screenTitle, color: colors.text },
  identity: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.md,
  },
  avatarText: { fontSize: 30, fontWeight: '900', color: colors.accentOn },
  email: { color: colors.text, fontSize: 17, fontWeight: '700', maxWidth: '90%' },
  weightChip: {
    marginTop: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  weightText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  profileStats: {
    marginHorizontal: space.xl,
    marginBottom: space.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 6,
  },
  profileStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileStatsTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  profileStatLine: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  menu: { paddingHorizontal: space.xl, marginTop: space.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: space.md,
  },
  menuText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' },
  menuBadge: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  logoutBtn: { marginTop: space.xl, borderBottomWidth: 0 },
  logoutText: { color: colors.danger },
  pressed: { opacity: 0.85 },
  versionText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: space.xxxl,
  },
});
