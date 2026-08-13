import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { garminBadgeLabel, useGarminLinkStatus } from '../../hooks/useGarminLinkStatus';
import { useHabitStreak } from '../../hooks/useHabitStreak';
import { syncOfflineLogs } from '../../lib/offlineSync';
import { useSmokeMode } from '../../lib/SmokeContext';
import { SMOKE_USER_ID } from '../../lib/smokeMode';
import { sqliteService } from '../../lib/sqlite';
import type { HabitStreak } from '../../lib/streak';
import { isSyncFailureFeedback, mapSyncFeedback } from '../../lib/syncFeedback';
import { appConfig } from '../../platform/constants';
import { Ionicons } from '../../platform/icons';
import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';
import { useStore } from '../../store/useStore';
import { colors, hitSlop, radius, space, typography } from '../../theme';
import { GarminConnectModal } from '../modals/GarminConnectModal';
import { ProfileEditModal } from '../modals/ProfileEditModal';
import { SettingsModal } from '../modals/SettingsModal';
import { WeightUpdateModal } from '../modals/WeightUpdateModal';
import { Screen } from '../ui/Screen';
import { StreakChip } from '../ui/StreakChip';
import { SyncFailBanner } from '../ui/SyncFailBanner';

const SMOKE_STREAK: HabitStreak = {
  currentStreak: 0,
  weekCount: 0,
  weekTarget: 3,
  trainedToday: false,
};

export const ProfileView = () => {
  const { user, signOut } = useAuth();
  const smokeMode = useSmokeMode();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showGarmin, setShowGarmin] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const lastSyncFeedback = useStore((s) => s.lastSyncFeedback);
  const setLastSyncFeedback = useStore((s) => s.setLastSyncFeedback);
  const setOfflineQueueCount = useStore((s) => s.setOfflineQueueCount);

  // Smoke deep-link: auto-open profile modals without credentials.
  const smokeModal = smokeMode.kind === 'tabs' ? smokeMode.modal : undefined;
  const [openedSmokeModal, setOpenedSmokeModal] = useState<string | undefined>();
  if (smokeModal && smokeModal !== openedSmokeModal) {
    setOpenedSmokeModal(smokeModal);
    if (smokeModal === 'settings') setShowSettings(true);
    if (smokeModal === 'garmin') setShowGarmin(true);
    if (smokeModal === 'weight') setShowWeightModal(true);
    if (smokeModal === 'profile-edit') setShowProfileEdit(true);
  }

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
  const weekTarget = settings?.training_days_per_week ?? 3;
  const { data: habitStreak } = useHabitStreak(user?.id, weekTarget);
  const streakForUi = habitStreak ?? (smokeMode.kind === 'tabs' ? SMOKE_STREAK : null);

  const onRefresh = async () => {
    await refetchWeight();
    await queryClient.invalidateQueries({ queryKey: ['user_settings'] });
  };

  const handleForceSync = useCallback(async () => {
    if (syncingQueue) return;
    setSyncingQueue(true);
    hapticService.light();
    try {
      const result = await syncOfflineLogs();
      const remaining = await sqliteService.getQueueCount();
      setOfflineQueueCount(remaining);
      const feedback = mapSyncFeedback({
        synced: result.synced,
        failed: result.failed,
        remaining,
      });
      if (isSyncFailureFeedback(feedback)) {
        setLastSyncFeedback(feedback);
      } else {
        setLastSyncFeedback(null);
        if (feedback.kind === 'ok') hapticService.success();
      }
    } finally {
      setSyncingQueue(false);
    }
  }, [syncingQueue, setOfflineQueueCount, setLastSyncFeedback]);

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

        <SyncFailBanner
          feedback={lastSyncFeedback}
          testID="profile-sync-fail-banner"
          syncing={syncingQueue}
          onPress={handleForceSync}
          onDismiss={() => setLastSyncFeedback(null)}
        />

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
            accessibilityHint="Apre l’aggiornamento del peso corporeo"
            hitSlop={hitSlop}
          >
            <Ionicons name="scale-outline" size={16} color={colors.accent} />
            <Text style={styles.weightText} importantForAccessibility="no">
              {displayWeight} kg
            </Text>
          </Pressable>
          {streakForUi ? <StreakChip streak={streakForUi} testID="profile-streak-chip" /> : null}
        </View>

        <Pressable
          testID="profile-edit-card"
          style={({ pressed }) => [styles.profileStats, pressed && styles.pressed]}
          onPress={() => setShowProfileEdit(true)}
          accessibilityRole="button"
          accessibilityLabel="Modifica dati profilo"
          accessibilityHint="Apre altezza, esperienza, obiettivo e giorni di allenamento"
          hitSlop={hitSlop}
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
            accessibilityLabel={garminBadge ? `Garmin Connect, ${garminBadge}` : 'Garmin Connect'}
            accessibilityHint="Apre collegamento e sincronizzazione Garmin"
            hitSlop={hitSlop}
          >
            <Ionicons name="watch-outline" size={22} color={colors.text} />
            <Text style={styles.menuText} importantForAccessibility="no">
              Garmin Connect
            </Text>
            {garminBadge ? (
              <Text style={styles.menuBadge} importantForAccessibility="no">
                {garminBadge}
              </Text>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>

          <Pressable
            testID="profile-settings-row"
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            onPress={() => setShowSettings(true)}
            accessibilityRole="button"
            accessibilityLabel="Impostazioni"
            accessibilityHint="Apre vibrazione, timer, suono e notifiche"
            hitSlop={hitSlop}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
            <Text style={styles.menuText} importantForAccessibility="no">
              Impostazioni
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>

          <Pressable
            testID="profile-logout"
            style={({ pressed }) => [styles.menuItem, styles.logoutBtn, pressed && styles.pressed]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Esci dall'account"
            accessibilityHint="Disconnette l’account da questo dispositivo"
            hitSlop={hitSlop}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={[styles.menuText, styles.logoutText]} importantForAccessibility="no">
              Esci dall'account
            </Text>
          </Pressable>
        </View>

        <Text style={styles.versionText}>
          KineFit v{version} · Build {build}
        </Text>
      </ScrollView>

      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
      <GarminConnectModal visible={showGarmin} onClose={() => setShowGarmin(false)} />

      {/* Mount shells even without session so smoke can open/close (save still needs auth). */}
      <WeightUpdateModal
        visible={showWeightModal}
        userId={user?.id ?? SMOKE_USER_ID}
        initialWeight={bodyWeight}
        onClose={() => setShowWeightModal(false)}
        onSaved={() => {
          void refetchWeight();
        }}
      />
      <ProfileEditModal
        visible={showProfileEdit}
        userId={user?.id ?? SMOKE_USER_ID}
        settings={settings}
        onClose={() => setShowProfileEdit(false)}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ['user_settings'] });
        }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  header: { paddingHorizontal: space.xl, paddingTop: space.sm },
  title: { ...typography.screenTitle, color: colors.text },
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
