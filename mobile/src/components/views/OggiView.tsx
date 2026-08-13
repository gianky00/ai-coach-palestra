import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScrollGestureGuard } from '../../hooks/useScrollGestureGuard';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { syncOfflineLogs } from '../../lib/offlineSync';
import { sqliteService } from '../../lib/sqlite';
import { DAYS } from '../../lib/utils';
import { exerciseService } from '../../services/exerciseService';
import { hapticService } from '../../services/soundService';
import { useStore } from '../../store/useStore';
import type { Exercise } from '../../types';
import { AddExerciseModal } from '../modals/AddExerciseModal';
import { LogExerciseModal } from '../modals/LogExerciseModal';
import { WorkoutSummaryModal } from '../modals/WorkoutSummaryModal';
import { Skeleton } from '../ui/Skeleton';

type ExerciseWithProgress = Exercise & { sets_done: number; completed: boolean };

export const OggiView = () => {
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
    fetchData,
  } = useWorkoutData(selectedDay);

  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [showAddEx, setShowAddEx] = useState(false);
  const [editingEx, setEditingEx] = useState<Exercise | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [sessionRecoveredDismissed, setSessionRecoveredDismissed] = useState(false);
  const { isScrollingRef, markScrolling, markScrollIdle } = useScrollGestureGuard(60);
  const offlineQueueCount = useStore((s) => s.offlineQueueCount);
  const setOfflineQueueCount = useStore((s) => s.setOfflineQueueCount);

  const showSessionRecovered =
    !!activeSession &&
    !sessionRecoveredDismissed &&
    !loading &&
    selectedDay === DAYS[new Date().getDay()];

  const handleStartWorkout = useCallback(() => {
    setSessionRecoveredDismissed(true);
    startWorkout();
  }, [startWorkout]);

  const handleForceSync = useCallback(async () => {
    if (syncingQueue) return;
    setSyncingQueue(true);
    hapticService.light();
    try {
      const result = await syncOfflineLogs();
      const remaining = await sqliteService.getQueueCount();
      setOfflineQueueCount(remaining);
      if (remaining === 0) {
        hapticService.success();
        Alert.alert(
          'Sincronizzato',
          `${result.synced} element${result.synced === 1 ? 'o' : 'i'} inviati.`,
        );
      } else if (result.synced > 0) {
        Alert.alert(
          'Sync parziale',
          `${result.synced} ok, ${remaining} ancora in coda. Riprova tra poco.`,
        );
      } else {
        Alert.alert(
          'Sync non riuscita',
          'Controlla la connessione e riprova. Se persiste, i dati restano salvati sul telefono.',
        );
      }
    } finally {
      setSyncingQueue(false);
    }
  }, [syncingQueue, setOfflineQueueCount]);

  const displayExercises = useMemo(() => {
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

  useEffect(() => {
    if (activeSession && selectedDay === DAYS[new Date().getDay()]) {
      if (__DEV__) console.log('Sessione attiva rilevata:', activeSession);
    }
  }, [activeSession, selectedDay]);

  const handleDragEnd = async ({ data }: { data: ExerciseWithProgress[] }) => {
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
  };

  const openExercise = useCallback(
    (item: ExerciseWithProgress, isActive: boolean) => {
      if (isActive || isScrollingRef.current) return;
      hapticService.light();
      setSelectedEx(item);
    },
    [isScrollingRef],
  );

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ExerciseWithProgress>) => (
      <ScaleDecorator>
        <TouchableOpacity
          style={[
            styles.card,
            item.completed && styles.cardCompleted,
            isActive && styles.cardDragging,
          ]}
          onPress={() => openExercise(item, isActive)}
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="reorder-three" size={22} color="#666" />
          </TouchableOpacity>
          <View style={styles.cardInfo}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseGroup}>
              {item.muscle_group} • {item.target_sets} serie
            </Text>
          </View>
          <View style={styles.cardAction}>
            <Text style={styles.setsDone}>
              {item.sets_done} / {item.target_sets}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isScrollingRef.current) return;
                hapticService.light();
                setEditingEx(item);
              }}
              activeOpacity={1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="create-outline" size={20} color="#666" />
            </TouchableOpacity>
            <Ionicons
              name={item.completed ? 'checkmark-circle' : 'add-circle'}
              size={24}
              color={item.completed ? '#00ff88' : '#888'}
            />
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    ),
    [openExercise, isScrollingRef],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>KineFit 🔥</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              testID="oggi-add-exercise"
              style={styles.actionBtn}
              onPress={() => setShowAddEx(true)}
            >
              <Ionicons name="add" size={26} color="#00ff88" />
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <Ionicons name="information-circle-outline" size={26} color="#fff" />
            </Pressable>
          </View>
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
                <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>
                  {day}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {offlineQueueCount > 0 && (
          <Pressable style={styles.offlineBanner} onPress={handleForceSync} disabled={syncingQueue}>
            {syncingQueue ? (
              <ActivityIndicator size="small" color="#ffcc00" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={16} color="#ffcc00" />
            )}
            <Text style={styles.offlineBannerText}>
              {syncingQueue
                ? 'Sincronizzazione…'
                : `${offlineQueueCount} element${offlineQueueCount === 1 ? 'o' : 'i'} in attesa — tocca per sync`}
            </Text>
          </Pressable>
        )}

        {showSessionRecovered && activeSession && selectedDay === DAYS[new Date().getDay()] && (
          <Pressable
            style={styles.recoveredBanner}
            onPress={() => setSessionRecoveredDismissed(true)}
          >
            <Ionicons name="refresh-circle-outline" size={18} color="#ffcc00" />
            <Text style={styles.recoveredBannerText}>
              Sessione ripresa dall’ultima chiusura — tocca per nascondere
            </Text>
          </Pressable>
        )}

        {activeSession && selectedDay === DAYS[new Date().getDay()] && (
          <View style={styles.activeSessionBanner}>
            <Ionicons name="flash" size={16} color="#000" />
            <Text style={styles.activeSessionText}>Allenamento in corso...</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(totalVolume / 100) / 10}k</Text>
            <Text style={styles.statLabel}>Volume Oggi (kg)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(progresso)}%</Text>
            <Text style={styles.statLabel}>Completato</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Esercizi {selectedDay}</Text>
            <Text style={styles.sectionHint}>Tieni premuto ≡ per riordinare</Text>
          </View>
          {selectedDay === DAYS[new Date().getDay()] &&
            (!activeSession ? (
              <Pressable
                testID="workout-start-button"
                style={styles.startBtn}
                onPress={handleStartWorkout}
              >
                <Ionicons name="play" size={16} color="#000" />
                <Text style={styles.startBtnText}>INIZIA</Text>
              </Pressable>
            ) : (
              <Pressable
                testID="workout-end-button"
                style={[styles.startBtn, styles.endBtn]}
                onPress={() => endWorkout(activeSession)}
              >
                <Text style={styles.endBtnText}>TERMINA</Text>
              </Pressable>
            ))}
        </View>
      </View>
    ),
    [
      selectedDay,
      offlineQueueCount,
      syncingQueue,
      activeSession,
      totalVolume,
      progresso,
      handleStartWorkout,
      endWorkout,
      handleForceSync,
      showSessionRecovered,
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']} testID="screen-oggi">
      {loading ? (
        renderSkeletons()
      ) : (
        <DraggableFlatList
          containerStyle={styles.listFlex}
          style={styles.listFlex}
          data={displayExercises}
          renderItem={renderDraggableItem}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          activationDistance={24}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={markScrolling}
          onScrollEndDrag={() => markScrollIdle()}
          onMomentumScrollBegin={markScrolling}
          onMomentumScrollEnd={() => markScrollIdle(0)}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nessun esercizio per {selectedDay}.</Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchData()}
              tintColor="#00ff88"
            />
          }
        />
      )}

      <LogExerciseModal
        visible={!!selectedEx}
        exercise={selectedEx}
        activeSession={activeSession}
        selectedDay={selectedDay}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  greeting: { fontSize: 24, fontWeight: '800', color: '#fff' },
  date: { fontSize: 14, color: '#aaa', marginTop: 4, textTransform: 'capitalize' },
  daySelectorContainer: { marginBottom: 20 },
  daySelector: { paddingHorizontal: 20, gap: 10 },
  dayBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
  },
  dayBtnActive: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
  dayBtnPressed: { opacity: 0.85 },
  dayText: { color: '#888', fontWeight: '700', fontSize: 13 },
  dayTextActive: { color: '#000' },
  activeSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
  },
  recoveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2618',
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffcc0055',
  },
  recoveredBannerText: { color: '#ffcc00', fontWeight: '700', fontSize: 12, flex: 1 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffcc001a',
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffcc0033',
  },
  offlineBannerText: { color: '#ffcc00', fontWeight: '700', fontSize: 12, flex: 1 },
  activeSessionText: { color: '#000', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: 15, paddingHorizontal: 20, marginBottom: 30 },
  statCard: {
    flex: 1,
    backgroundColor: '#252525',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#00ff88' },
  statLabel: { fontSize: 12, color: '#aaa', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sectionHint: { fontSize: 11, color: '#666', marginTop: 2 },
  startBtn: {
    flexDirection: 'row',
    backgroundColor: '#00ff88',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    alignItems: 'center',
    gap: 6,
  },
  startBtnText: { fontSize: 12, fontWeight: '900', color: '#000' },
  endBtn: { backgroundColor: '#ff4444' },
  endBtnText: { fontSize: 12, fontWeight: '900', color: '#fff' },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 140, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardCompleted: { borderColor: '#00ff8866', backgroundColor: '#1f2a22' },
  cardDragging: { borderColor: '#00ff88' },
  dragHandle: { marginRight: 8, paddingVertical: 4, paddingHorizontal: 2 },
  cardInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  exerciseGroup: { fontSize: 12, color: '#aaa', marginTop: 2 },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  setsDone: { fontSize: 14, fontWeight: '600', color: '#888' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 16 },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#333',
  },
});
