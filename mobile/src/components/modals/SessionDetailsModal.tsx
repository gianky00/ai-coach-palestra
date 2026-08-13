import { useQuery } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Ionicons } from '../../platform/icons';
import { sessionNotesService } from '../../services/sessionNotesService';
import { sessionService } from '../../services/sessionService';
import { colors, hitSlop, radius, space } from '../../theme';
import type { SessionLogDetail } from '../../types';

interface SessionDetailsModalProps {
  visible: boolean;
  sessionId: string | null;
  onClose: () => void;
}

const SessionLogRow = React.memo(function SessionLogRow({ item }: { item: SessionLogDetail }) {
  const name = item.exercises?.name ?? 'Esercizio';
  const group = item.exercises?.muscle_group ?? '';
  return (
    <View
      style={styles.logItem}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${name}${group ? `, ${group}` : ''}: ${item.weight} chilogrammi per ${item.reps} ripetizioni, RPE ${item.rpe ?? 'non impostato'}`}
    >
      <View style={styles.exInfo} importantForAccessibility="no">
        <Text style={styles.exName}>{item.exercises?.name}</Text>
        <Text style={styles.exGroup}>{item.exercises?.muscle_group}</Text>
      </View>
      <View style={styles.logData} importantForAccessibility="no">
        <Text style={styles.logValue}>
          {item.weight}kg x {item.reps}
        </Text>
        <Text style={styles.logRpe}>RPE {item.rpe}</Text>
      </View>
    </View>
  );
});

const keyExtractor = (item: SessionLogDetail, index: number) =>
  `${item.created_at}-${item.exercises?.name ?? 'ex'}-${item.weight}-${item.reps}-${index}`;

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

  const { data: sessionNote = '' } = useQuery({
    queryKey: ['session-note', sessionId],
    queryFn: async () => {
      if (!sessionId) return '';
      return sessionNotesService.getNote(sessionId);
    },
    enabled: !!sessionId && visible,
  });

  const renderItem = useCallback(
    ({ item }: { item: SessionLogDetail }) => <SessionLogRow item={item} />,
    [],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content} testID="modal-session-details">
              <View style={styles.header}>
                <Text style={styles.title}>Dettagli Sessione</Text>
                <TouchableOpacity
                  testID="session-details-close-button"
                  onPress={onClose}
                  hitSlop={hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel="Chiudi dettagli sessione"
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 50 }} />
              ) : (
                <FlatList
                  data={logs}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  contentContainerStyle={styles.list}
                  initialNumToRender={12}
                  maxToRenderPerBatch={10}
                  updateCellsBatchingPeriod={50}
                  windowSize={5}
                  removeClippedSubviews
                  ListHeaderComponent={
                    sessionNote ? (
                      <View
                        style={styles.noteCard}
                        testID="session-details-note"
                        accessible
                        accessibilityRole="text"
                        accessibilityLabel={`Note sessione: ${sessionNote}`}
                      >
                        <Text style={styles.noteLabel} importantForAccessibility="no">
                          Note sessione
                        </Text>
                        <Text style={styles.noteBody} importantForAccessibility="no">
                          {sessionNote}
                        </Text>
                      </View>
                    ) : null
                  }
                  ListEmptyComponent={
                    <Text
                      style={styles.empty}
                      accessibilityRole="text"
                      accessibilityLabel="Nessun set registrato in questa sessione"
                    >
                      Nessun set registrato in questa sessione.
                    </Text>
                  }
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  noteCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.lg,
    gap: space.xs,
  },
  noteLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  noteBody: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
