import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
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
import { useSmokeMode } from '../../lib/SmokeContext';
import { SMOKE_FIXTURE_SESSION_ID } from '../../lib/smokeMode';
import { Ionicons } from '../../platform/icons';
import { exportService } from '../../services/exportService';
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
}

export const HistoryView = () => {
  const { user } = useAuth();
  const smokeMode = useSmokeMode();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  // Smoke deep-link: open session details shell without credentials.
  const smokeModal = smokeMode.kind === 'tabs' ? smokeMode.modal : undefined;
  const [openedSmokeModal, setOpenedSmokeModal] = useState<string | undefined>();
  if (smokeModal === 'session' && openedSmokeModal !== 'session') {
    setOpenedSmokeModal('session');
    setSelectedSessionId(SMOKE_FIXTURE_SESSION_ID);
  }

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
    queryKey: ['sessions', 'history', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const data = await sessionService.fetchSessionsWithStats();
      return (data as SessionWithLogs[]) || [];
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
    ({ item }: { item: SessionWithLogs }) => {
      const volume =
        item.training_logs?.reduce((acc: number, log) => acc + log.weight * log.reps, 0) || 0;

      return (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Sessione ${new Date(item.start_time).toLocaleDateString('it-IT')}`}
          onPress={() => openSession(item.id)}
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
          <View style={styles.volumeTag}>
            <Ionicons name="barbell-outline" size={14} color={colors.accent} />
            <Text style={styles.volumeText}>{volume} kg</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>
      );
    },
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
          <View>
            <Text style={styles.title}>Cronologia</Text>
            <Text style={styles.subtitle}>Sessioni completate</Text>
          </View>
          <Button
            testID="history-export-button"
            variant="icon"
            loading={exporting}
            disabled={exporting || isLoading}
            onPress={handleExport}
            accessibilityLabel="Esporta CSV"
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyBox} testID="history-empty-state">
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `Nessuna sessione per “${searchQuery.trim()}”.`
                : 'Nessun allenamento ancora.'}
            </Text>
            <Text style={styles.emptyHint}>
              {searchQuery.trim()
                ? 'Cancella la ricerca o prova un’altra data.'
                : 'Completa un workout da Oggi: lo storico si aggiorna qui.'}
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
    alignItems: 'center',
    marginBottom: space.lg,
  },
  title: { ...typography.screenTitle, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
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
