import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '../../platform/icons';
import { useStore } from '../../store/useStore';
import { colors, hitSlop, radius, space, typography } from '../../theme';

export const WorkoutSummaryModal = () => {
  const showSummary = useStore((s) => s.showSummary);
  const setShowSummary = useStore((s) => s.setShowSummary);
  const lastWorkoutSummary = useStore((s) => s.lastWorkoutSummary);

  if (!lastWorkoutSummary) return null;

  return (
    <Modal
      visible={showSummary}
      animationType="fade"
      transparent
      onRequestClose={() => setShowSummary(false)}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowSummary(false)}
          accessibilityRole="button"
          accessibilityLabel="Chiudi riepilogo allenamento"
        />
        <View
          style={styles.modalContent}
          testID="modal-workout-summary"
          accessibilityLabel={`Allenamento completato. Volume ${lastWorkoutSummary.totalVolume} chilogrammi, ${lastWorkoutSummary.setsDone} serie, ${lastWorkoutSummary.durationMins} minuti, ${lastWorkoutSummary.prsCount} record personali`}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="trophy" size={50} color={colors.accent} />
          </View>

          <Text style={styles.title}>Allenamento completato</Text>
          <Text style={styles.subtitle}>Ottimo lavoro — ecco il riepilogo di oggi.</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lastWorkoutSummary.totalVolume}kg</Text>
              <Text style={styles.statLabel}>Volume totale</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lastWorkoutSummary.setsDone}</Text>
              <Text style={styles.statLabel}>Serie totali</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lastWorkoutSummary.durationMins}min</Text>
              <Text style={styles.statLabel}>Durata</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lastWorkoutSummary.prsCount}</Text>
              <Text style={styles.statLabel}>Nuovi PR</Text>
            </View>
          </View>

          <Pressable
            testID="workout-summary-close-button"
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            onPress={() => setShowSummary(false)}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Chiudi"
          >
            <Text style={styles.closeBtnText}>CHIUDI</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
  },
  modalContent: {
    backgroundColor: colors.surfaceMuted,
    width: '100%',
    borderRadius: radius.xl + 8,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.xl,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  title: { ...typography.section, color: colors.text, fontSize: 24, textAlign: 'center' },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: space.sm,
    textAlign: 'center',
    marginBottom: space.xxxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 40,
    justifyContent: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', minWidth: '40%' },
  statValue: { color: colors.accent, fontSize: 20, fontWeight: '900' },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  closeBtn: {
    backgroundColor: colors.accent,
    width: '100%',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  closeBtnText: { color: colors.accentOn, fontWeight: '900', fontSize: 16 },
  pressed: { opacity: 0.88 },
});
