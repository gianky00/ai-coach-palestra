import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useStore } from '../../store/useStore';

export const WorkoutSummaryModal = () => {
  const { showSummary, setShowSummary, lastWorkoutSummary } = useStore();

  if (!lastWorkoutSummary) return null;

  return (
    <Modal
      visible={showSummary}
      animationType="fade"
      transparent
      onRequestClose={() => setShowSummary(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowSummary(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="trophy" size={50} color="#00ff88" />
              </View>

              <Text style={styles.title}>Allenamento Completato!</Text>
              <Text style={styles.subtitle}>Ottimo lavoro, hai spaccato oggi.</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lastWorkoutSummary.totalVolume}kg</Text>
                  <Text style={styles.statLabel}>Volume Totale</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lastWorkoutSummary.setsDone}</Text>
                  <Text style={styles.statLabel}>Serie Totali</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{lastWorkoutSummary.durationMins}min</Text>
                  <Text style={styles.statLabel}>Durata</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowSummary(false)}>
                <Text style={styles.closeBtnText}>CHIUDI</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#252525',
    width: '100%',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#aaa', fontSize: 16, marginTop: 8, textAlign: 'center', marginBottom: 30 },
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#00ff88', fontSize: 20, fontWeight: '900' },
  statLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  closeBtn: {
    backgroundColor: '#00ff88',
    width: '100%',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  closeBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
});
