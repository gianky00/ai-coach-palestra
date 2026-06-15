import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { useLogExercise } from '../../hooks/useLogExercise';
import { getExerciseGuide } from '../../lib/exerciseAssets';
import { hapticService } from '../../services/soundService';
import { useTimerStore } from '../../store/useTimerStore';
import type { Exercise } from '../../types';
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
  const { startTimer } = useTimerStore();
  const [showPlates, setShowPlates] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const logData = useLogExercise({
    user,
    selectedEx: exercise || ({} as Exercise),
    activeSession,
    selectedDay,
    onSuccess: (restTime) => {
      hapticService.success();
      if (restTime) startTimer(restTime);
    },
  });

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
    if (!isCompex && currentWeightNum > 0 && currentRepsNum > 0) {
      return Math.round(currentWeightNum * (1 + currentRepsNum / 30));
    }
    return 0;
  }, [currentWeightNum, currentRepsNum, isCompex]);

  if (!exercise || !user) return null;

  const guide = getExerciseGuide(exercise.name, exercise.muscle_group);

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
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContent}
            >
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>{exercise.name}</Text>
                  <Text style={styles.subtitle}>
                    {isCompex ? 'Elettrostimolazione SP 4.0' : exercise.muscle_group}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  {!isCompex && (
                    <TouchableOpacity
                      onPress={() => setShowGuide(!showGuide)}
                      style={styles.iconBtn}
                    >
                      <Ionicons
                        name="help-circle-outline"
                        size={24}
                        color={showGuide ? '#00ff88' : '#fff'}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.iconBtn}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close" size={24} color={isSubmitting ? '#888' : '#fff'} />
                  </TouchableOpacity>
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
                      <Text style={[styles.infoValue, { color: '#ffcc00' }]}>
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
                        <TouchableOpacity onPress={() => setShowPlates(!showPlates)}>
                          <Ionicons
                            name="calculator-outline"
                            size={16}
                            color={showPlates ? '#00ff88' : '#888'}
                          />
                        </TouchableOpacity>
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
                  <View style={[styles.typeSelector, { marginTop: showPlates ? 20 : 0 }]}>
                    <TouchableOpacity
                      style={[styles.typeBtn, setType === 'S' && styles.typeBtnActive]}
                      onPress={() => {
                        hapticService.light();
                        setSetType('S');
                      }}
                    >
                      <Text style={[styles.typeText, setType === 'S' && styles.typeTextActive]}>
                        Allenante
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeBtn, setType === 'F' && styles.typeBtnActive]}
                      onPress={() => {
                        hapticService.light();
                        setSetType('F');
                      }}
                    >
                      <Text style={[styles.typeText, setType === 'F' && styles.typeTextActive]}>
                        Cedimento
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.saveBtn, isSubmitting && styles.disabled]}
                    onPress={() => handleSaveLog()}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.saveBtnText}>
                      {isCompex ? 'REGISTRA SESSIONE' : 'SALVA SET'}
                    </Text>
                  </TouchableOpacity>

                  {currentExLogs.length > 0 && (
                    <TouchableOpacity
                      style={[styles.fastLogBtn, isSubmitting && styles.disabled]}
                      onPress={() => {
                        hapticService.medium();
                        fastLogLast();
                      }}
                      disabled={isSubmitting}
                    >
                      <Ionicons name="duplicate-outline" size={24} color="#00ff88" />
                    </TouchableOpacity>
                  )}
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
                        </Text>
                        <Text style={styles.historyRpe}>Effort {log.rpe}</Text>
                        <TouchableOpacity onPress={() => handleDeleteLog(log)}>
                          <Ionicons name="trash-outline" size={20} color="#ff4444" />
                        </TouchableOpacity>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerActions: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#aaa', marginTop: 2 },
  guideBox: {
    backgroundColor: '#00ff881a',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00ff8833',
  },
  guideTitle: {
    color: '#00ff88',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  guideTip: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  guideDot: { color: '#00ff88', fontWeight: 'bold' },
  guideText: { color: '#ccc', fontSize: 13, flex: 1, lineHeight: 18 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  infoCard: {
    flex: 1,
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoLabel: { fontSize: 10, color: '#888', fontWeight: '700', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#00ff88', fontWeight: '800' },
  form: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  inputGroup: { flex: 1 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 12, color: '#aaa' },
  input: {
    backgroundColor: '#252525',
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    padding: 12,
    borderRadius: 12,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 25 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#252525',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  typeBtnActive: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
  typeText: { color: '#888', fontSize: 12, fontWeight: '700' },
  typeTextActive: { color: '#000' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#00ff88',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  fastLogBtn: {
    backgroundColor: '#252525',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00ff8833',
    width: 65,
  },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
  historySection: { paddingBottom: 40 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    gap: 15,
  },
  historyIndex: { color: '#888', width: 20, fontWeight: '700' },
  historyText: { color: '#fff', flex: 1, fontSize: 16, fontWeight: '600' },
  historyRpe: { color: '#00ff88', fontSize: 12, fontWeight: '700', marginRight: 10 },
  failureBadge: { color: '#ffcc00', fontSize: 12, fontWeight: '800' },
  emptyText: { color: '#666', fontStyle: 'italic' },
  disabled: { opacity: 0.5 },
  lastSessionSection: { marginBottom: 25, marginHorizontal: -20 },
  sectionTitleSmall: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
  },
  lastSessionScroll: { paddingHorizontal: 20, gap: 10 },
  lastSessionCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    minWidth: 90,
  },
  lastSessionIndex: { color: '#888', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  lastSessionText: { color: '#00ff88', fontSize: 15, fontWeight: '800' },
  lastSessionRpe: { color: '#aaa', fontSize: 10, marginTop: 4 },
});
