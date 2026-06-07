import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { sessionService } from '../../services/sessionService';
import type { SessionLogDetail } from '../../types';

interface SessionDetailsModalProps {
  visible: boolean;
  sessionId: string | null;
  onClose: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  visible,
  sessionId,
  onClose,
}) => {
  const { data: logs, isLoading } = useQuery<SessionLogDetail[]>({
    queryKey: ['session-details', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data } = await sessionService.fetchSessionDetails(sessionId);
      return (data as SessionLogDetail[]) || [];
    },
    enabled: !!sessionId,
  });

  const renderItem = ({ item }: { item: SessionLogDetail }) => (
    <View style={styles.logItem}>
      <View style={styles.exInfo}>
        <Text style={styles.exName}>{item.exercises?.name}</Text>
        <Text style={styles.exGroup}>{item.exercises?.muscle_group}</Text>
      </View>
      <View style={styles.logData}>
        <Text style={styles.logValue}>
          {item.weight}kg x {item.reps}
        </Text>
        <Text style={styles.logRpe}>RPE {item.rpe}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Dettagli Sessione</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={logs}
              renderItem={renderItem}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.empty}>Nessun dato per questa sessione.</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  content: {
    backgroundColor: '#1a1a1a',
    height: '80%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  list: { paddingBottom: 30 },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  exInfo: { flex: 1 },
  exName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  exGroup: { color: '#888', fontSize: 12, marginTop: 2 },
  logData: { alignItems: 'flex-end' },
  logValue: { color: '#00ff88', fontSize: 16, fontWeight: '800' },
  logRpe: { color: '#666', fontSize: 12, fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
});
