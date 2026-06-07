import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sessionService } from '../../services/sessionService';
import { hapticService } from '../../services/soundService';
import { SessionDetailsModal } from '../modals/SessionDetailsModal';

interface SessionWithLogs {
  id: string;
  start_time: string;
  end_time: string | null;
  training_logs: {
    weight: number;
    reps: number;
    exercises: {
      name: string;
    } | null;
  }[];
}

export const HistoryView = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sessions, isLoading } = useQuery<SessionWithLogs[]>({
    queryKey: ['sessions', 'history'],
    queryFn: async () => {
      const { data } = await sessionService.fetchSessionsWithStats();
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
      const hasExercise = sess.training_logs?.some((log) =>
        log.exercises?.name?.toLowerCase().includes(query),
      );
      return dateStr.includes(query) || hasExercise;
    });
  }, [sessions, searchQuery]);

  const renderItem = ({ item }: { item: SessionWithLogs }) => {
    const volume =
      item.training_logs?.reduce((acc: number, log) => acc + log.weight * log.reps, 0) || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          hapticService.light();
          setSelectedSessionId(item.id);
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.date}>
            {new Date(item.start_time).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          <View style={styles.durationTag}>
            <Ionicons name="barbell-outline" size={14} color="#00ff88" />
            <Text style={styles.durationText}>{volume}kg</Text>
          </View>
        </View>
        <View style={styles.sessionMain}>
          <Text style={styles.sessionTitle}>Sessione di Allenamento</Text>
          <Ionicons name="chevron-forward" size={18} color="#444" />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cronologia</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per data o esercizio..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredSessions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Nessun allenamento trovato.</Text>}
      />

      <SessionDetailsModal
        visible={!!selectedSessionId}
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  header: { padding: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    gap: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: '#252525',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  date: { color: '#888', fontSize: 12, fontWeight: '700' },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00ff881a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  durationText: { color: '#00ff88', fontSize: 11, fontWeight: '800' },
  sessionMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },
});
