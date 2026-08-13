import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useHabitStreak } from '../../hooks/useHabitStreak';
import { useScrollGestureGuard } from '../../hooks/useScrollGestureGuard';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { filterExercisesByQuery } from '../../lib/exerciseFilter';
import { syncOfflineLogs } from '../../lib/offlineSync';
import { useSmokeMode } from '../../lib/SmokeContext';
import { SMOKE_FIXTURE_EXERCISE } from '../../lib/smokeMode';
import { sqliteService } from '../../lib/sqlite';
import { EMPTY_HABIT_STREAK } from '../../lib/streak';
import {
  buildOfflineQueueCopy,
  isSyncFailureFeedback,
  mapSyncFeedback,
  type SyncFeedback,
} from '../../lib/syncFeedback';
import { DAYS } from '../../lib/utils';
import { Ionicons } from '../../platform/icons';
import { exerciseService } from '../../services/exerciseService';
import { profileService } from '../../services/profileService';
import { sessionNotesService } from '../../services/sessionNotesService';
import { hapticService } from '../../services/soundService';
import { useStore } from '../../store/useStore';
import { colors, hitSlop, radius, space, typography } from '../../theme';
import type { Exercise } from '../../types';
import { AddExerciseModal } from '../modals/AddExerciseModal';
import { LogExerciseModal } from '../modals/LogExerciseModal';
import { WorkoutSummaryModal } from '../modals/WorkoutSummaryModal';
import { Button } from '../ui/Button';
import { Screen } from '../ui/Screen';
import { Skeleton } from '../ui/Skeleton';
import { StreakChip } from '../ui/StreakChip';
import { SyncFailBanner } from '../ui/SyncFailBanner';
import { VolumeChip } from '../ui/VolumeChip';

type ExerciseWithProgress = Exercise & { sets_done: number; completed: boolean };

const oggiExerciseKeyExtractor = (item: ExerciseWithProgress) => item.id;

const OggiExerciseRow = React.memo(function OggiExerciseRow({
  item,
  drag,
  isActive,
  onOpen,
  onEdit,
  isScrollingRef,
}: {
  item: ExerciseWithProgress;
  drag: () => void;
  isActive: boolean;
  onOpen: (item: ExerciseWithProgress, isActive: boolean) => void;
  onEdit: (item: ExerciseWithProgress) => void;
  isScrollingRef: React.MutableRefObject<boolean>;
}) {
  return (
    <ScaleDecorator>
      <TouchableOpacity
        testID={`oggi-exercise-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.muscle_group}, ${item.sets_done} di ${item.target_sets} serie${item.completed ? ', completato' : ''}`}
        accessibilityHint="Apri per registrare un set"
        accessibilityState={{ disabled: isActive, selected: item.completed }}
        style={[
          styles.card,
          item.completed && styles.cardCompleted,
          isActive && styles.cardDragging,
        ]}
        onPress={() => onOpen(item, isActive)}
        disabled={isActive}
        activeOpacity={1}
        delayPressIn={120}
      >
        <TouchableOpacity
          onLongPress={() => {
            if (isScrollingRef.current) return;
            hapticService.light();
            drag();
          }}
          delayLongPress={250}
          activeOpacity={1}
          style={styles.dragHandle}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={`Riordina ${item.name}`}
          accessibilityHint="Tieni premuto e trascina per cambiare l’ordine"
        >
          <Ionicons name="reorder-three" size={22} color="#666" />
        </TouchableOpacity>
        <View style={styles.cardInfo} importantForAccessibility="no">
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseGroup}>
            {item.muscle_group} • {item.target_sets} serie
          </Text>
        </View>
        <View style={styles.cardAction}>
          <Text style={styles.setsDone} importantForAccessibility="no">
            {item.sets_done}/{item.target_sets}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (isScrollingRef.current) return;
              onEdit(item);
            }}
            activeOpacity={1}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`Modifica ${item.name}`}
            accessibilityHint="Apre la scheda di modifica esercizio"
          >
            <Ionicons name="create-outline" size={20} color={colors.textDim} />
          </TouchableOpacity>
          <Ionicons
            name={item.completed ? 'checkmark-circle' : 'add-circle'}
            size={24}
            color={item.completed ? colors.accent : colors.textMuted}
            importantForAccessibility="no"
          />
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );
});

export const OggiView = () => {
  const smokeMode = useSmokeMode();
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay()]);

  const {
    user,
    exercises,
    loading,
    totalVolume,
    progresso,
    activeSession,
    startWorkout,
    endWorkout,
    workoutActionPending,
    fetchData,
  } = useWorkoutData(selectedDay);

  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [showAddEx, setShowAddEx] = useState(false);
  const [editingEx, setEditingEx] = useState<Exercise | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [sessionRecoveredDismissed, setSessionRecoveredDismissed] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const { isScrollingRef, markScrolling, markScrollIdle } = useScrollGestureGuard(60);
  const offlineQueueCount = useStore((s) => s.offlineQueueCount);
  const setOfflineQueueCount = useStore((s) => s.setOfflineQueueCount);
  const lastSyncFeedback = useStore((s) => s.lastSyncFeedback);
  const setLastSyncFeedback = useStore((s) => s.setLastSyncFeedback);
  const [syncToast, setSyncToast] = useState<SyncFeedback | null>(null);
  const { data: settings } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: () => profileService.fetchUserSettings(),
    enabled: !!user,
  });
  const weekTarget = settings?.training_days_per_week ?? 3;
  const { data: habitStreak } = useHabitStreak(user?.id, weekTarget);
  const streakForUi = habitStreak ?? (smokeMode.kind === 'tabs' ? EMPTY_HABIT_STREAK : null);
  const smokeShowPrToast = smokeMode.kind === 'tabs' ? !!smokeMode.showPrToast : false;

  // Smoke deep-link: open log / add-exercise shells without credentials.
  // useEffect + queueMicrotask: avoid render-time setState (React 19) and sync setState-in-effect lint.
  const smokeModal = smokeMode.kind === 'tabs' ? smokeMode.modal : undefined;
  const [openedSmokeModal, setOpenedSmokeModal] = useState<string | undefined>();
  useEffect(() => {
    if (!smokeModal || smokeModal === openedSmokeModal) return;
    queueMicrotask(() => {
      setOpenedSmokeModal(smokeModal);
      if (smokeModal === 'log') setSelectedEx(SMOKE_FIXTURE_EXERCISE);
      if (smokeModal === 'add-exercise') setShowAddEx(true);
    });
  }, [smokeModal, openedSmokeModal]);

  const showSessionRecovered =
    !!activeSession &&
    !sessionRecoveredDismissed &&
    !loading &&
    selectedDay === DAYS[new Date().getDay()];

  const handleStartWorkout = useCallback(() => {
    setSessionRecoveredDismissed(true);
    startWorkout();
  }, [startWorkout]);

  useEffect(() => {
    if (!syncToast) return;
    const t = setTimeout(() => setSyncToast(null), 3200);
    return () => clearTimeout(t);
  }, [syncToast]);

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
        setSyncToast(feedback);
      } else {
        setLastSyncFeedback(null);
        setSyncToast(feedback);
        if (feedback.kind === 'ok') hapticService.success();
      }
    } finally {
      setSyncingQueue(false);
    }
  }, [syncingQueue, setOfflineQueueCount, setLastSyncFeedback]);

  const orderedExercises = useMemo(() => {
    if (!dragOrder?.length) return exercises;
    const map = new Map(exercises.map((e) => [e.id, e]));
    const ordered: typeof exercises = [];
    for (const id of dragOrder) {
      const ex = map.get(id);
      if (ex) ordered.push(ex);
    }
    for (const ex of exercises) {
      if (!dragOrder.includes(ex.id)) ordered.push(ex);
    }
    return ordered;
  }, [exercises, dragOrder]);

  const displayExercises = useMemo(
    () => filterExercisesByQuery(orderedExercises, exerciseQuery),
    [orderedExercises, exerciseQuery],
  );

  const [noteSessionId, setNoteSessionId] = useState<string | null>(activeSession);
  if (noteSessionId !== activeSession) {
    setNoteSessionId(activeSession);
    setSessionNote('');
  }

  useEffect(() => {
    if (!activeSession) return;
    let cancelled = false;
    void sessionNotesService.getNote(activeSession).then((note) => {
      if (!cancelled) setSessionNote(note);
    });
    return () => {
      cancelled = true;
    };
  }, [activeSession]);

  const persistSessionNote = useCallback(async () => {
    if (!activeSession) return;
    setNoteSaving(true);
    try {
      await sessionNotesService.setNote(activeSession, sessionNote);
      hapticService.light();
    } finally {
      setNoteSaving(false);
    }
  }, [activeSession, sessionNote]);

  useEffect(() => {
    if (activeSession && selectedDay === DAYS[new Date().getDay()]) {
      if (__DEV__) console.log('Sessione attiva rilevata:', activeSession);
    }
  }, [activeSession, selectedDay]);

  const handleDragEnd = useCallback(
    async ({ data }: { data: ExerciseWithProgress[] }) => {
      const orderedIds = data.map((e) => e.id);
      setDragOrder(orderedIds);
      if (!user) return;

      hapticService.success();
      const { error } = await exerciseService.reorderExercises(orderedIds);
      if (error) {
        hapticService.error();
        setDragOrder(null);
        await fetchData();
        return;
      }
      await fetchData();
      setDragOrder(null);
    },
    [user, fetchData],
  );

  const openExercise = useCallback(
    (item: ExerciseWithProgress, isActive: boolean) => {
      if (isActive || isScrollingRef.current) return;
      hapticService.light();
      setSelectedEx(item);
    },
    [isScrollingRef],
  );

  const editExercise = useCallback((item: ExerciseWithProgress) => {
    hapticService.light();
    setEditingEx(item);
  }, []);

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ExerciseWithProgress>) => (
      <OggiExerciseRow
        item={item}
        drag={drag}
        isActive={isActive}
        onOpen={openExercise}
        onEdit={editExercise}
        isScrollingRef={isScrollingRef}
      />
    ),
    [openExercise, editExercise, isScrollingRef],
  );

  const offlineQueueCopy = buildOfflineQueueCopy(offlineQueueCount, syncingQueue);

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Oggi</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
            <View style={styles.chipRow}>
              {streakForUi ? <StreakChip streak={streakForUi} testID="oggi-streak-chip" /> : null}
              {selectedDay === DAYS[new Date().getDay()] ? (
                <VolumeChip kg={totalVolume} testID="oggi-volume-chip" />
              ) : null}
            </View>
          </View>
          <Button
            testID="oggi-add-exercise"
            variant="icon"
            onPress={() => setShowAddEx(true)}
            accessibilityLabel="Aggiungi esercizio"
          >
            <Ionicons name="add" size={26} color={colors.accent} />
          </Button>
        </View>

        <View style={styles.daySelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelector}
            nestedScrollEnabled
          >
            {DAYS.map((day) => (
              <Pressable
                key={day}
                testID={`oggi-day-${day}`}
                accessibilityRole="button"
                accessibilityLabel={`Giorno ${day}`}
                accessibilityHint="Mostra gli esercizi di questo giorno"
                accessibilityState={{ selected: selectedDay === day }}
                hitSlop={hitSlop}
                style={({ pressed }) => [
                  styles.dayBtn,
                  selectedDay === day && styles.dayBtnActive,
                  pressed && selectedDay !== day && styles.dayBtnPressed,
                ]}
                onPress={() => {
                  hapticService.light();
                  setDragOrder(null);
                  setSelectedDay(day);
                }}
              >
                <Text
                  style={[styles.dayText, selectedDay === day && styles.dayTextActive]}
                  importantForAccessibility="no"
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {offlineQueueCount > 0 && (
          <Pressable
            testID="oggi-offline-banner"
            style={styles.offlineBanner}
            onPress={handleForceSync}
            disabled={syncingQueue}
            accessibilityRole="button"
            accessibilityLabel={offlineQueueCopy.accessibilityLabel}
            accessibilityHint={offlineQueueCopy.accessibilityHint}
            accessibilityState={{ disabled: syncingQueue, busy: syncingQueue }}
          >
            {syncingQueue ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={16} color={colors.warning} />
            )}
            <Text style={styles.offlineBannerText} importantForAccessibility="no">
              {offlineQueueCopy.bannerText}
            </Text>
          </Pressable>
        )}

        <SyncFailBanner
          feedback={lastSyncFeedback}
          testID="oggi-sync-fail-banner"
          syncing={syncingQueue}
          onPress={handleForceSync}
          onDismiss={() => setLastSyncFeedback(null)}
        />

        {syncToast ? (
          <View
            testID="oggi-sync-toast"
            style={[
              styles.syncToast,
              isSyncFailureFeedback(syncToast) ? styles.syncToastFail : styles.syncToastOk,
            ]}
            accessibilityRole="text"
            accessibilityLabel={syncToast.bannerText}
          >
            <Ionicons
              name={isSyncFailureFeedback(syncToast) ? 'warning-outline' : 'checkmark-circle'}
              size={16}
              color={isSyncFailureFeedback(syncToast) ? colors.danger : colors.accent}
            />
            <Text
              style={[
                styles.syncToastText,
                isSyncFailureFeedback(syncToast) && styles.syncToastTextFail,
              ]}
            >
              {syncToast.bannerText}
            </Text>
          </View>
        ) : null}

        {showSessionRecovered && activeSession && selectedDay === DAYS[new Date().getDay()] && (
          <Pressable
            style={styles.recoveredBanner}
            onPress={() => setSessionRecoveredDismissed(true)}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Sessione ripresa"
            accessibilityHint="Tocca per nascondere questo avviso"
          >
            <Ionicons name="refresh-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.recoveredBannerText} importantForAccessibility="no">
              Sessione ripresa — tocca per nascondere
            </Text>
          </Pressable>
        )}

        {activeSession && selectedDay === DAYS[new Date().getDay()] && (
          <View
            style={styles.activeSessionBanner}
            accessible
            accessibilityRole="text"
            accessibilityLabel="Allenamento in corso"
          >
            <Ionicons name="flash" size={16} color={colors.accentOn} />
            <Text style={styles.activeSessionText} importantForAccessibility="no">
              Allenamento in corso
            </Text>
          </View>
        )}

        {activeSession && selectedDay === DAYS[new Date().getDay()] && (
          <View style={styles.noteBox} testID="oggi-session-notes">
            <Text style={styles.noteLabel}>Note sessione</Text>
            <TextInput
              testID="oggi-session-note-input"
              style={styles.noteInput}
              value={sessionNote}
              onChangeText={setSessionNote}
              placeholder="Come ti senti? Focus, RPE, note…"
              placeholderTextColor={colors.textDim}
              multiline
              maxLength={500}
              accessibilityLabel="Note sessione"
              accessibilityHint="Scrivi come ti senti, focus o RPE della sessione"
              onBlur={() => {
                void persistSessionNote();
              }}
            />
            <Button
              testID="oggi-session-note-save"
              variant="ghost"
              title={noteSaving ? 'Salvataggio…' : 'Salva nota'}
              onPress={() => {
                void persistSessionNote();
              }}
              loading={noteSaving}
              disabled={noteSaving}
              accessibilityLabel="Salva nota sessione"
              accessibilityHint="Salva le note di questa sessione sul dispositivo"
            />
          </View>
        )}

        <View style={styles.statsRow}>
          <View
            style={styles.statBlock}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Volume ${Math.round(totalVolume / 100) / 10}k chilogrammi`}
          >
            <Text style={styles.statValue} importantForAccessibility="no">
              {Math.round(totalVolume / 100) / 10}k
            </Text>
            <Text style={styles.statLabel} importantForAccessibility="no">
              Volume (kg)
            </Text>
          </View>
          <View style={styles.statDivider} importantForAccessibility="no" />
          <View
            style={styles.statBlock}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Completato ${Math.round(progresso)} percento`}
          >
            <Text style={styles.statValue} importantForAccessibility="no">
              {Math.round(progresso)}%
            </Text>
            <Text style={styles.statLabel} importantForAccessibility="no">
              Completato
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Esercizi {selectedDay}</Text>
            <Text style={styles.sectionHint}>Tieni premuto ≡ per riordinare</Text>
          </View>
          {selectedDay === DAYS[new Date().getDay()] &&
            (!activeSession ? (
              <Button
                testID="workout-start-button"
                onPress={handleStartWorkout}
                disabled={workoutActionPending}
                loading={workoutActionPending}
                accessibilityLabel="Inizia allenamento"
                accessibilityHint="Avvia una nuova sessione per oggi"
                style={styles.startBtn}
              >
                <View style={styles.startBtnInner} importantForAccessibility="no">
                  <Ionicons name="play" size={16} color={colors.accentOn} />
                  <Text style={styles.startBtnText}>INIZIA</Text>
                </View>
              </Button>
            ) : (
              <Button
                testID="workout-end-button"
                variant="danger"
                title="TERMINA"
                onPress={() => endWorkout(activeSession)}
                disabled={workoutActionPending}
                loading={workoutActionPending}
                accessibilityLabel="Termina allenamento"
                accessibilityHint="Chiude la sessione e mostra il riepilogo"
                style={styles.endBtn}
                textStyle={styles.endBtnText}
              />
            ))}
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textDim} importantForAccessibility="no" />
          <TextInput
            testID="oggi-exercise-search"
            style={styles.searchInput}
            placeholder="Filtra nome o muscolo…"
            placeholderTextColor={colors.textDim}
            value={exerciseQuery}
            onChangeText={setExerciseQuery}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Filtra esercizi"
            accessibilityHint="Filtra per nome o muscolo; accenti opzionali; più parole restringono i risultati"
          />
          {exerciseQuery !== '' && (
            <Pressable
              testID="oggi-exercise-search-clear"
              onPress={() => setExerciseQuery('')}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Cancella filtro"
              accessibilityHint="Mostra di nuovo tutti gli esercizi del giorno"
            >
              <Ionicons name="close-circle" size={18} color={colors.textDim} />
            </Pressable>
          )}
        </View>
      </View>
    ),
    [
      selectedDay,
      offlineQueueCount,
      offlineQueueCopy,
      syncingQueue,
      lastSyncFeedback,
      syncToast,
      setLastSyncFeedback,
      activeSession,
      totalVolume,
      progresso,
      handleStartWorkout,
      endWorkout,
      handleForceSync,
      showSessionRecovered,
      streakForUi,
      sessionNote,
      noteSaving,
      persistSessionNote,
      exerciseQuery,
      workoutActionPending,
    ],
  );

  const renderSkeletons = () => (
    <View style={{ flex: 1 }}>
      {listHeader}
      <View style={{ paddingHorizontal: 20 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="70%" height={18} />
              <Skeleton width="40%" height={12} />
            </View>
            <Skeleton width={40} height={40} borderRadius={20} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Screen testID="screen-oggi">
      {loading ? (
        renderSkeletons()
      ) : (
        <DraggableFlatList
          containerStyle={styles.listFlex}
          style={styles.listFlex}
          data={displayExercises}
          renderItem={renderDraggableItem}
          keyExtractor={oggiExerciseKeyExtractor}
          onDragEnd={handleDragEnd}
          activationDistance={24}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
          onScrollBeginDrag={markScrolling}
          onScrollEndDrag={() => markScrollIdle()}
          onMomentumScrollBegin={markScrolling}
          onMomentumScrollEnd={() => markScrollIdle(0)}
          ListEmptyComponent={
            <View
              style={styles.emptyBox}
              testID="oggi-empty-state"
              accessibilityRole="summary"
              accessibilityLabel={
                exerciseQuery.trim()
                  ? `Nessun esercizio per ${exerciseQuery.trim()}`
                  : `Nessun esercizio per ${selectedDay}`
              }
            >
              <Text style={styles.emptyText} importantForAccessibility="no">
                {exerciseQuery.trim()
                  ? `Nessun esercizio per “${exerciseQuery.trim()}”.`
                  : `Nessun esercizio per ${selectedDay}.`}
              </Text>
              <Text style={styles.emptyHint} importantForAccessibility="no">
                {exerciseQuery.trim()
                  ? 'Prova un altro filtro o cancella la ricerca.'
                  : 'Aggiungi il primo esercizio della scheda.'}
              </Text>
              {exerciseQuery.trim() ? (
                <Button
                  testID="oggi-empty-clear-filter"
                  variant="outline"
                  title="Cancella filtro"
                  onPress={() => setExerciseQuery('')}
                  accessibilityHint="Rimuove il filtro di ricerca esercizi"
                />
              ) : (
                <Button
                  testID="oggi-empty-add-cta"
                  title="Aggiungi esercizio"
                  onPress={() => setShowAddEx(true)}
                  accessibilityHint="Apre il modulo per aggiungere un esercizio alla scheda"
                />
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchData()}
              tintColor={colors.accent}
            />
          }
        />
      )}

      <LogExerciseModal
        visible={!!selectedEx}
        exercise={selectedEx}
        activeSession={activeSession}
        selectedDay={selectedDay}
        forcePrToast={smokeShowPrToast}
        onClose={() => setSelectedEx(null)}
      />

      <AddExerciseModal
        userId={user?.id || ''}
        visible={showAddEx}
        onClose={() => setShowAddEx(false)}
        onSuccess={() => fetchData()}
        defaultDay={selectedDay}
      />

      <AddExerciseModal
        userId={user?.id || ''}
        visible={!!editingEx}
        exercise={editingEx}
        onClose={() => setEditingEx(null)}
        onSuccess={() => fetchData()}
        defaultDay={selectedDay}
      />

      <WorkoutSummaryModal />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    marginBottom: space.xl,
  },
  greeting: { ...typography.screenTitle, color: colors.text },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
  },
  startBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteBox: {
    marginHorizontal: space.xl,
    marginBottom: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    gap: space.sm,
  },
  noteLabel: {
    ...typography.overline,
    color: colors.textMuted,
  },
  noteInput: {
    minHeight: 56,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlignVertical: 'top',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.xl,
    marginBottom: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    gap: space.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', paddingVertical: 4 },
  daySelectorContainer: { marginBottom: space.lg },
  daySelector: { paddingHorizontal: space.xl, gap: space.sm },
  dayBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayBtnPressed: { opacity: 0.85 },
  dayText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  dayTextActive: { color: colors.accentOn },
  activeSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    marginHorizontal: space.xl,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    gap: space.sm,
    marginBottom: space.lg,
  },
  recoveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2618',
    marginHorizontal: space.xl,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    gap: space.sm,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  recoveredBannerText: { color: colors.warning, fontWeight: '700', fontSize: 12, flex: 1 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningMuted,
    marginHorizontal: space.xl,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    gap: space.sm,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: '#ffcc0033',
  },
  offlineBannerText: { color: colors.warning, fontWeight: '700', fontSize: 12, flex: 1 },
  syncToast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.xl,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    gap: space.sm,
    marginBottom: space.md,
    borderWidth: 1,
  },
  syncToastOk: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentMuted,
  },
  syncToastFail: {
    backgroundColor: colors.dangerMuted,
    borderColor: '#ff444455',
  },
  syncToastText: { color: colors.accent, fontWeight: '700', fontSize: 12, flex: 1 },
  syncToastTextFail: { color: colors.danger },
  activeSessionText: {
    color: colors.accentOn,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: space.xl,
    marginBottom: space.xxl,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statBlock: { flex: 1 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: space.lg,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.accent },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    marginBottom: space.md,
  },
  sectionTitle: { ...typography.section, color: colors.text },
  sectionHint: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  startBtn: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    gap: 6,
  },
  startBtnText: { fontSize: 12, fontWeight: '900', color: colors.accentOn },
  endBtn: { backgroundColor: colors.danger },
  endBtnText: { fontSize: 12, fontWeight: '900', color: colors.text },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: space.xl, paddingBottom: 140, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: space.lg,
    borderRadius: radius.lg,
    marginBottom: space.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompleted: { borderColor: '#00ff8866', backgroundColor: '#1a2420' },
  cardDragging: { borderColor: colors.accent },
  dragHandle: { marginRight: space.sm, paddingVertical: 4, paddingHorizontal: 2 },
  cardInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.text },
  exerciseGroup: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  setsDone: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingTop: 40,
    gap: space.md,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyHint: {
    color: colors.textDim,
    textAlign: 'center',
    fontSize: 13,
    marginBottom: space.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: space.lg,
    borderRadius: radius.lg,
    marginBottom: space.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
