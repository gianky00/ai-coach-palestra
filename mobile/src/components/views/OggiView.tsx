import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWorkoutData } from '../../hooks/useWorkoutData';
import { DAYS } from '../../lib/utils';
import { hapticService } from '../../services/soundService';
import type { Exercise } from '../../types';
import { AddExerciseModal } from '../modals/AddExerciseModal';
import { LogExerciseModal } from '../modals/LogExerciseModal';
import { WorkoutSummaryModal } from '../modals/WorkoutSummaryModal';
import { Skeleton } from '../ui/Skeleton';

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

  // --- SESSION RECOVERY LOGIC ---
  useEffect(() => {
    if (activeSession && selectedDay === DAYS[new Date().getDay()]) {
      // Potremmo mostrare un banner o un toast discreto
      console.log('Sessione attiva rilevata:', activeSession);
    }
  }, [activeSession, selectedDay]);

  const renderItem = ({ item }: { item: Exercise & { sets_done: number; completed: boolean } }) => (
    <TouchableOpacity
      style={[styles.card, item.completed && styles.cardCompleted]}
      onPress={() => {
        hapticService.light();
        setSelectedEx(item);
      }}
    >
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
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'add-circle'}
          size={24}
          color={item.completed ? '#00ff88' : '#888'}
        />
      </View>
    </TouchableOpacity>
  );

  const renderSkeletons = () => (
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
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAddEx(true)}>
            <Ionicons name="add" size={26} color="#00ff88" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="information-circle-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.daySelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayBtn, selectedDay === day && styles.dayBtnActive]}
              onPress={() => {
                hapticService.light();
                setSelectedDay(day);
              }}
            >
              <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
        <Text style={styles.sectionTitle}>Esercizi {selectedDay}</Text>
        {selectedDay === DAYS[new Date().getDay()] &&
          (!activeSession ? (
            <TouchableOpacity style={styles.startBtn} onPress={() => startWorkout()}>
              <Ionicons name="play" size={16} color="#000" />
              <Text style={styles.startBtnText}>INIZIA</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.startBtn, styles.endBtn]}
              onPress={() => endWorkout(activeSession)}
            >
              <Text style={styles.endBtnText}>TERMINA</Text>
            </TouchableOpacity>
          ))}
      </View>

      {loading ? (
        renderSkeletons()
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  list: { paddingHorizontal: 20, paddingBottom: 20 },
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
  cardCompleted: { opacity: 0.6, borderColor: '#00ff8833' },
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
