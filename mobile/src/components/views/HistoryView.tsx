import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import {
  computeSessionDurationMins,
  formatSessionDurationA11y,
  formatSessionDurationLabel,
} from '../../lib/sessionDuration';
import { formatSessionPrA11y, formatSessionPrLabel } from '../../lib/sessionPr';
import { useSmokeMode } from '../../lib/SmokeContext';
import { isSmokeDataMode, SMOKE_FIXTURE_SESSION_ID } from '../../lib/smokeMode';
import { fetchSmokeHistorySessions } from '../../lib/smokeSeed';
import {
  computeSessionVolumeKg,
  formatVolumeA11yLabel,
  formatVolumeKg,
} from '../../lib/volumeFormat';
import { Ionicons } from '../../platform/icons';
import { exportService } from '../../services/exportService';
import { sessionPrService } from '../../services/sessionPrService';
import { sessionService } from '../../services/sessionService';
import { hapticService } from '../../services/soundService';
import { colors, hitSlop, radius, space, typography } from '../../theme';
import { SessionDetailsModal } from '../modals/SessionDetailsModal';
import { Button } from '../ui/Button';
import { Screen } from '../ui/Screen';

interface SessionWithLogs {
  id: string;
  start_time: string;
  end_time: string | null;
  training_logs: {
    weight: number;
    reps: number;
  }[];
  prCount?: number;
}

const HistorySessionRow = React.memo(function HistorySessionRow({
  item,
  onPress,
}: {
  item: SessionWithLogs;
  onPress: (id: string) => void;
}) {
  const volume = computeSessionVolumeKg(item.training_logs);
  const durationMins = computeSessionDurationMins(item.start_time, item.end_time);
  const prCount = item.prCount ?? 0;
  const dateLabel = new Date(item.start_time).toLocaleDateString('it-IT');
  const volumeLabel = formatVolumeKg(volume);
  const durationLabel = formatSessionDurationLabel(durationMins);
  const prLabel = formatSessionPrLabel(prCount);
  const prA11y = formatSessionPrA11y(prCount);
  const a11yParts = [
    `Sessione ${dateLabel}`,
    formatSessionDurationA11y(durationMins),
    formatVolumeA11yLabel(volume, 'session'),
    prA11y,
  ].filter(Boolean);

  return (
    <Pressable
      testID={`history-session-${item.id}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={a11yParts.join('. ')}
      accessibilityHint="Tocca per aprire i dettagli della sessione"
      onPress={() => onPress(item.id)}
    >
      <View style={styles.rowMain}>
        <Text style={styles.date}>
          {new Date(item.start_time).toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.sessionTitle}>Allenamento</Text>
      </View>
      <View style={styles.metaTags}>
        {prCount > 0 && prLabel ? (
          <View
            style={styles.prTag}
            testID={`history-session-pr-${item.id}`}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Ionicons name="trophy" size={14} color={colors.warning} />
            <Text style={styles.prText}>{prLabel}</Text>
          </View>
        ) : null}
        <View
          style={styles.durationTag}
          testID={`history-session-duration-${item.id}`}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="time-outline" size={14} color={colors.info} />
          <Text style={styles.durationText}>{durationLabel}</Text>
        </View>
        <View
          style={styles.volumeTag}
          testID={`history-session-volume-${item.id}`}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="barbell-outline" size={14} color={colors.accent} />
          <Text style={styles.volumeText}>{volumeLabel}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
});

const keyExtractor = (item: SessionWithLogs) => item.id;

export const HistoryView = () => {
  const { user } = useAuth();
  const smokeMode = useSmokeMode();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  // Smoke deep-link: open session details shell without credentials.
  // useEffect + queueMicrotask: avoid render-time setState (React 19) and sync setState-in-effect lint.
  const smokeModal = smokeMode.kind === 'tabs' ? smokeMode.modal : undefined;
  const [openedSmokeModal, setOpenedSmokeModal] = useState<string | undefined>();
  useEffect(() => {
    if (smokeModal !== 'session' || openedSmokeModal === 'session') return;
    queueMicrotask(() => {
      setOpenedSmokeModal('session');
      setSelectedSessionId(SMOKE_FIXTURE_SESSION_ID);
    });
  }, [smokeModal, openedSmokeModal]);

  const handleExport = async () => {
    setExporting(true);
    hapticService.medium();
    try {
      await exportService.exportSessionsToCsv();
    } catch {
      hapticService.error();
    } finally {
      setExporting(false);
    }
  };

  const {
    data: sessions,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<SessionWithLogs[]>({
    queryKey: ['sessions', 'history', user?.id, smokeMode.kind],
    enabled: !!user || isSmokeDataMode(smokeMode),
    queryFn: async () => {
      const prCounts = await sessionPrService.getAll();
      if (!user) {
        const smoke = await fetchSmokeHistorySessions();
        return smoke.map((s) => ({
          ...s,
          prCount: s.prCount ?? prCounts[s.id] ?? 0,
        })) as SessionWithLogs[];
      }
      const data = await sessionService.fetchSessionsWithStats();
      const rows = (data as SessionWithLogs[]) || [];
      return rows.map((s) => ({
        ...s,
        prCount: prCounts[s.id] ?? s.prCount ?? 0,
      }));
    },
  });

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (!searchQuery.trim()) return sessions;

    const query = searchQuery.toLowerCase();
    return sessions.filter((sess) => {
      const dateStr = new Date(sess.start_time)
        .toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
        .toLowerCase();
      return dateStr.includes(query);
    });
  }, [sessions, searchQuery]);

  const openSession = useCallback((id: string) => {
    hapticService.light();
    setSelectedSessionId(id);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SessionWithLogs }) => (
      <HistorySessionRow item={item} onPress={openSession} />
    ),
    [openSession],
  );

  if (isLoading) {
    return (
      <Screen bare style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </Screen>
    );
  }

  return (
    <Screen testID="screen-history">
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <Text style={styles.title} accessibilityRole="header">
              Cronologia
            </Text>
            <Text style={styles.subtitle}>Sessioni completate</Text>
            <Text
              style={styles.sessionHint}
              testID="history-session-hint"
              accessibilityRole="text"
              accessibilityLabel="Tocca una sessione per vedere i dettagli"
            >
              Tocca una sessione per i dettagli
            </Text>
          </View>
          <Button
            testID="history-export-button"
            variant="icon"
            loading={exporting}
            disabled={exporting || isLoading}
            onPress={handleExport}
            accessibilityLabel="Esporta cronologia in CSV"
            accessibilityHint="Crea e condivide un file CSV con le sessioni completate"
          >
            <Ionicons name="download-outline" size={22} color={colors.accent} />
          </Button>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textDim} />
          <TextInput
            testID="history-search-input"
            style={styles.searchInput}
            placeholder="Cerca per data…"
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Cerca sessioni"
          />
          {searchQuery !== '' && (
            <Pressable
              testID="history-clear-search"
              onPress={() => setSearchQuery('')}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Cancella ricerca"
            >
              <Ionicons name="close-circle" size={18} color={colors.textDim} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        testID="history-sessions-list"
        data={filteredSessions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyBox} testID="history-empty-state">
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `Nessuna sessione per “${searchQuery.trim()}”.`
                : 'Nessuna sessione in cronologia.'}
            </Text>
            <Text style={styles.emptyHint}>
              {searchQuery.trim()
                ? 'Cancella la ricerca o prova un’altra data.'
                : 'Completa un allenamento da Oggi: comparirà qui nello storico.'}
            </Text>
            {searchQuery.trim() ? (
              <Button
                testID="history-empty-clear-search"
                variant="outline"
                title="Cancella ricerca"
                onPress={() => setSearchQuery('')}
              />
            ) : (
              <Button
                testID="history-empty-goto-hint"
                variant="outline"
                title="Vai a Oggi e inizia"
                onPress={() => hapticService.light()}
              />
            )}
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
      />

      <SessionDetailsModal
        visible={!!selectedSessionId}
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.md },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.lg,
    gap: space.md,
  },
  headerCopy: { flex: 1, paddingRight: space.sm },
  title: { ...typography.screenTitle, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  sessionHint: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: space.sm,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: space.xl, paddingBottom: 120, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: space.md,
  },
  rowPressed: { backgroundColor: colors.surfaceElevated, borderRadius: radius.sm },
  rowMain: { flex: 1, gap: 2 },
  date: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  sessionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  metaTags: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  durationText: { color: colors.info, fontSize: 11, fontWeight: '800' },
  prTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warningBorder,
  },
  prText: { color: colors.warning, fontSize: 11, fontWeight: '800' },
  volumeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  volumeText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  emptyText: { color: colors.textSecondary, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  emptyHint: { color: colors.textDim, textAlign: 'center', fontSize: 13, marginBottom: space.sm },
});
