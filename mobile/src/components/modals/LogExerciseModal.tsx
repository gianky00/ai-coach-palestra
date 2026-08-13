import React, { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { useLogExercise } from '../../hooks/useLogExercise';
import { getExerciseGuide } from '../../lib/exerciseAssets';
import { formatRestPresetLabel, REST_PRESETS_SECONDS } from '../../lib/restPresets';
import { isSmokeFixtureExercise } from '../../lib/smokeMode';
import { calculateE1RM } from '../../lib/utils';
import { Ionicons } from '../../platform/icons';
import { hapticService } from '../../services/soundService';
import { useStore } from '../../store/useStore';
import { useTimerStore } from '../../store/useTimerStore';
import { colors, hitSlop, radius, space } from '../../theme';
import type { Exercise } from '../../types';
import { Button } from '../ui/Button';
import { PlateCalculator } from '../ui/PlateCalculator';

interface LogExerciseModalProps {
  visible: boolean;
  exercise: Exercise | null;
  activeSession: string | null;
  selectedDay?: string;
  onClose: () => void;
}

export const LogExerciseModal: React.FC<LogExerciseModalProps> = ({
  visible,
  exercise,
  activeSession,
  selectedDay,
  onClose,
}) => {
  const { user } = useAuth();
  const startTimer = useTimerStore((s) => s.startTimer);
  const timerAutoStart = useStore((s) => s.timerAutoStart);
  const [showPlates, setShowPlates] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [prToastVisible, setPrToastVisible] = useState(false);

  const logData = useLogExercise({
    user,
    selectedEx: exercise || ({} as Exercise),
    activeSession,
    selectedDay,
    onSuccess: (restTime, meta) => {
      if (meta?.isPR) setPrToastVisible(true);
      if (restTime && timerAutoStart) startTimer(restTime);
    },
  });

  useEffect(() => {
    if (!prToastVisible) return;
    const t = setTimeout(() => setPrToastVisible(false), 2800);
    return () => clearTimeout(t);
  }, [prToastVisible]);

  // Reset PR toast when modal closes (adjust state during render when prop changes).
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (!visible && prToastVisible) setPrToastVisible(false);
  }

  const {
    currentExLogs,
    personalRecord,
    lastSessionLogs,
    weight,
    setWeight,
    reps,
    setReps,
    rpe,
    setRpe,
    setType,
    setSetType,
    isSubmitting,
    handleSaveLog,
    fastLogLast,
    handleDeleteLog,
  } = logData;

  const isCompex = useMemo(() => {
    const name = exercise?.name?.toLowerCase() || '';
    const group = exercise?.muscle_group?.toLowerCase() || '';
    return (
      name.includes('compex') ||
      name.includes('massaggio') ||
      group.includes('compex') ||
      group.includes('massaggio')
    );
  }, [exercise]);

  const currentWeightNum = parseFloat(weight) || 0;
  const currentRepsNum = parseInt(reps, 10) || 0;

  const estimated1RM = useMemo(() => {
    if (!isCompex) return calculateE1RM(currentWeightNum, currentRepsNum);
    return 0;
  }, [currentWeightNum, currentRepsNum, isCompex]);

  const guide = useMemo(
    () => (exercise ? getExerciseGuide(exercise.name, exercise.muscle_group) : []),
    [exercise],
  );

  // Smoke shell: fixture exercise without credentials (save stays no-op via !user).
  if (!exercise || (!user && !isSmokeFixtureExercise(exercise))) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => !isSubmitting && onClose()}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          if (!isSubmitting) onClose();
        }}
      >
        <View style={styles.overlay} testID="modal-log-exercise">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContent}
            >
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>{exercise.name}</Text>
                  <Text style={styles.subtitle}>
                    {isCompex ? 'Elettrostimolazione SP 4.0' : exercise.muscle_group}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  {!isCompex && (
                    <Pressable
                      onPress={() => setShowGuide(!showGuide)}
                      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                      hitSlop={hitSlop}
                      accessibilityRole="button"
                      accessibilityLabel="Guida esecuzione"
                    >
                      <Ionicons
                        name="help-circle-outline"
                        size={24}
                        color={showGuide ? colors.accent : colors.text}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    testID="log-close-button"
                    onPress={onClose}
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                    disabled={isSubmitting}
                    hitSlop={hitSlop}
                    accessibilityRole="button"
                    accessibilityLabel="Chiudi"
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={isSubmitting ? colors.textMuted : colors.text}
                    />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {!isCompex && showGuide && (
                  <View style={styles.guideBox}>
                    <Text style={styles.guideTitle}>Consigli Esecuzione:</Text>
                    {guide.map((tip, i) => (
                      <View key={i} style={styles.guideTip}>
                        <Text style={styles.guideDot}>•</Text>
                        <Text style={styles.guideText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.infoRow}>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>{isCompex ? 'RECORD INTENSITÀ' : 'RECORD'}</Text>
                    <Text style={styles.infoValue}>
                      {personalRecord
                        ? `${personalRecord.weight}${isCompex ? 'mA' : 'kg'} x ${personalRecord.reps}${isCompex ? 'm' : ''}`
                        : '--'}
                    </Text>
                  </View>
                  {!isCompex ? (
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>MASSIMALE (STIM.)</Text>
                      <Text style={[styles.infoValue, { color: colors.warning }]}>
                        {estimated1RM > 0 ? `${estimated1RM}kg` : '--'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>ULTIMO UTILIZZO</Text>
                      <Text style={styles.infoValue}>
                        {lastSessionLogs && lastSessionLogs.length > 0
                          ? `${lastSessionLogs[lastSessionLogs.length - 1].weight}mA`
                          : '--'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>{isCompex ? 'Intensità (mA)' : 'Peso (kg)'}</Text>
                      {!isCompex && (
                        <Pressable
                          testID="log-plates-toggle"
                          onPress={() => setShowPlates(!showPlates)}
                          hitSlop={hitSlop}
                          accessibilityRole="button"
                          accessibilityLabel="Calcolatore dischi"
                        >
                          <Ionicons
                            name="calculator-outline"
                            size={16}
                            color={showPlates ? colors.accent : colors.textMuted}
                          />
                        </Pressable>
                      )}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{isCompex ? 'Tempo (min)' : 'Reps'}</Text>
                    <TextInput
                      style={styles.input}
                      value={reps}
                      onChangeText={setReps}
                      keyboardType="numeric"
                      placeholder={isCompex ? '20' : '0'}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Sforzo (RPE)</Text>
                    <TextInput
                      style={styles.input}
                      value={rpe}
                      onChangeText={setRpe}
                      keyboardType="numeric"
                      placeholder="8"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>

                {!isCompex && showPlates && <PlateCalculator targetWeight={currentWeightNum} />}

                {/* --- SELETTORE TIPO SERIE SEMPLIFICATO --- */}
                {!isCompex && (
                  <View style={[styles.typeSelector, { marginTop: showPlates ? space.xl : 0 }]}>
                    {(
                      [
                        { key: 'W' as const, label: 'Riscald.' },
                        { key: 'S' as const, label: 'Allenante' },
                        { key: 'F' as const, label: 'Cedimento' },
                      ] as const
                    ).map((opt) => (
                      <Pressable
                        key={opt.key}
                        style={({ pressed }) => [
                          styles.typeBtn,
                          setType === opt.key && styles.typeBtnActive,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => {
                          hapticService.light();
                          setSetType(opt.key);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: setType === opt.key }}
                      >
                        <Text
                          style={[styles.typeText, setType === opt.key && styles.typeTextActive]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {prToastVisible && (
                  <View style={styles.prToast} testID="log-pr-toast">
                    <Ionicons name="trophy" size={18} color={colors.accentOn} />
                    <Text style={styles.prToastText}>Nuovo record personale!</Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <Button
                    testID="log-save-set-button"
                    title={isCompex ? 'REGISTRA SESSIONE' : 'SALVA SET'}
                    onPress={() => handleSaveLog()}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    style={styles.saveBtn}
                  />

                  {currentExLogs.length > 0 && (
                    <Pressable
                      testID="log-fast-repeat-button"
                      style={({ pressed }) => [
                        styles.fastLogBtn,
                        isSubmitting && styles.disabled,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        hapticService.medium();
                        fastLogLast();
                      }}
                      disabled={isSubmitting}
                      accessibilityRole="button"
                      accessibilityLabel="Ripeti ultimo set"
                    >
                      <Ionicons name="duplicate-outline" size={24} color={colors.accent} />
                    </Pressable>
                  )}
                </View>

                <View style={styles.restRow} testID="log-rest-presets">
                  <Text style={styles.restLabel}>Recupero</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.restChips}
                  >
                    {REST_PRESETS_SECONDS.map((secs) => (
                      <Button
                        key={secs}
                        testID={`log-rest-preset-${secs}`}
                        variant="outline"
                        title={formatRestPresetLabel(secs)}
                        style={styles.restChip}
                        textStyle={styles.restChipText}
                        onPress={() => {
                          hapticService.light();
                          startTimer(secs);
                        }}
                        accessibilityLabel={`Avvia recupero ${secs} secondi`}
                      />
                    ))}
                  </ScrollView>
                </View>

                {lastSessionLogs && lastSessionLogs.length > 0 && (
                  <View style={styles.lastSessionSection}>
                    <Text style={styles.sectionTitleSmall}>
                      Ultima Sessione (
                      {new Date(lastSessionLogs[0].created_at).toLocaleDateString('it-IT')})
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.lastSessionScroll}
                    >
                      {lastSessionLogs.map((log, i) => (
                        <View key={i} style={styles.lastSessionCard}>
                          <Text style={styles.lastSessionIndex}>Set {i + 1}</Text>
                          <Text style={styles.lastSessionText}>
                            {log.weight}
                            {isCompex ? 'mA' : 'kg'} x {log.reps}
                            {isCompex ? 'm' : ''}
                          </Text>
                          <Text style={styles.lastSessionRpe}>RPE {log.rpe || '--'}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.historySection}>
                  <Text style={styles.sectionTitle}>
                    {isCompex ? 'Cronologia Compex' : 'Set Registrati Oggi'}
                  </Text>
                  {currentExLogs.length === 0 ? (
                    <Text style={styles.emptyText}>Nessun dato registrato.</Text>
                  ) : (
                    currentExLogs.map((log, i) => (
                      <View key={log.tempId || i} style={styles.historyItem}>
                        <Text style={styles.historyIndex}>{i + 1}</Text>
                        <Text style={styles.historyText}>
                          {log.weight}
                          {isCompex ? 'mA' : 'kg'} x {log.reps}
                          {isCompex ? 'm' : ''}
                          {!isCompex && log.set_type === 'F' && (
                            <Text style={styles.failureBadge}> • Cedimento</Text>
                          )}
                          {!isCompex && log.set_type === 'W' && (
                            <Text style={styles.warmupBadge}> • Riscaldamento</Text>
                          )}
                        </Text>
                        <Text style={styles.historyRpe}>Effort {log.rpe}</Text>
                        <Pressable
                          onPress={() => handleDeleteLog(log)}
                          hitSlop={hitSlop}
                          accessibilityRole="button"
                          accessibilityLabel="Elimina set"
                        >
                          <Ionicons name="trash-outline" size={20} color={colors.danger} />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.xl,
  },
  headerText: { flex: 1, paddingRight: space.md },
  headerActions: { flexDirection: 'row', gap: space.md },
  iconBtn: { padding: 4 },
  pressed: { opacity: 0.85 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  guideBox: {
    backgroundColor: colors.accentSoft,
    padding: space.md,
    borderRadius: radius.md,
    marginBottom: space.xl,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  guideTitle: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: space.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  guideTip: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  guideDot: { color: colors.accent, fontWeight: 'bold' },
  guideText: { color: '#ccc', fontSize: 13, flex: 1, lineHeight: 18 },
  infoRow: { flexDirection: 'row', gap: space.md, marginBottom: space.xxl },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 16, color: colors.accent, fontWeight: '800' },
  form: { flexDirection: 'row', gap: space.md, marginBottom: space.xl },
  inputGroup: { flex: 1 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  label: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  input: {
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    padding: space.md,
    borderRadius: radius.md,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.textFaint,
  },
  typeSelector: { flexDirection: 'row', gap: space.sm, marginBottom: space.xxl },
  typeBtn: {
    flex: 1,
    paddingVertical: space.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  typeText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  typeTextActive: { color: colors.accentOn },
  actionRow: { flexDirection: 'row', gap: space.md, marginBottom: space.md },
  saveBtn: { flex: 1 },
  fastLogBtn: {
    backgroundColor: colors.surfaceMuted,
    padding: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentMuted,
    width: 65,
  },
  prToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    marginBottom: space.md,
  },
  prToastText: { color: colors.accentOn, fontWeight: '900', fontSize: 14, flex: 1 },
  restRow: { marginBottom: space.xxl, gap: space.sm },
  restLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  restChips: { flexDirection: 'row', gap: space.sm },
  restChip: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
  },
  restChipText: { fontSize: 12, fontWeight: '800', color: colors.accent },
  historySection: { paddingBottom: 40 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: space.md },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: space.md,
    borderRadius: radius.md,
    marginBottom: space.sm,
    gap: space.md,
  },
  historyIndex: { color: colors.textMuted, width: 20, fontWeight: '700' },
  historyText: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '600' },
  historyRpe: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    marginRight: space.sm,
  },
  failureBadge: { color: colors.warning, fontSize: 12, fontWeight: '800' },
  warmupBadge: { color: colors.info, fontSize: 12, fontWeight: '800' },
  emptyText: { color: colors.textDim, fontStyle: 'italic' },
  disabled: { opacity: 0.5 },
  lastSessionSection: { marginBottom: space.xxl, marginHorizontal: -space.xl },
  sectionTitleSmall: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: space.sm,
    paddingHorizontal: space.xl,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  lastSessionScroll: { paddingHorizontal: space.xl, gap: space.sm },
  lastSessionCard: {
    backgroundColor: colors.surfaceElevated,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.textFaint,
    alignItems: 'center',
    minWidth: 90,
  },
  lastSessionIndex: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  lastSessionText: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  lastSessionRpe: { color: colors.textSecondary, fontSize: 10, marginTop: 4 },
});
