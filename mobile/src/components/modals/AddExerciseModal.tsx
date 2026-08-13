import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { DAYS } from '../../lib/utils';
import { Ionicons } from '../../platform/icons';
import { exerciseService } from '../../services/exerciseService';
import { hapticService } from '../../services/soundService';
import { hitSlop } from '../../theme';
import type { Exercise } from '../../types';

interface AddExerciseModalProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDay?: string;
  exercise?: Exercise | null;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = (props) => {
  // Keep Modal mounted while visible toggles — early `return null` unmounted the
  // native dialog before dismiss and raced ops close → home/BACK on API 34+.
  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onClose}>
      {props.visible ? (
        <ExerciseFormContent key={props.exercise?.id ?? `add-${props.defaultDay}`} {...props} />
      ) : null}
    </Modal>
  );
};

const ExerciseFormContent: React.FC<AddExerciseModalProps> = ({
  userId,
  onClose,
  onSuccess,
  defaultDay,
  exercise,
}) => {
  const isEditMode = !!exercise;

  const [name, setName] = useState(exercise?.name ?? '');
  const [group, setGroup] = useState(exercise?.muscle_group ?? '');
  const [selectedDay, setSelectedDay] = useState(
    exercise?.training_day ?? defaultDay ?? DAYS[new Date().getDay()],
  );
  const [targetSets, setTargetSets] = useState(String(exercise?.target_sets ?? 3));
  const [targetReps, setTargetReps] = useState(exercise?.target_reps ?? '10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Attenzione', "Il nome dell'esercizio è obbligatorio");
      return;
    }

    setIsSubmitting(true);
    hapticService.medium();

    try {
      if (isEditMode && exercise) {
        const { error } = await exerciseService.updateExercise(exercise.id, {
          name: name.trim(),
          muscle_group: group.trim() || 'Varie',
          training_day: selectedDay,
          target_sets: parseInt(targetSets, 10) || 3,
          target_reps: targetReps || '10',
        });
        if (error) Alert.alert('Errore', "Impossibile aggiornare l'esercizio");
        else {
          hapticService.success();
          onSuccess();
          onClose();
        }
      } else {
        const { error } = await exerciseService.addExercise(
          userId,
          name.trim(),
          group.trim(),
          selectedDay,
        );
        if (error) Alert.alert('Errore', "Impossibile aggiungere l'esercizio");
        else {
          hapticService.success();
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      if (__DEV__) console.error('Error saving exercise:', err);
      Alert.alert('Errore', 'Si è verificato un problema imprevisto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorder = async (direction: 'up' | 'down') => {
    if (!exercise) return;
    setIsSubmitting(true);
    hapticService.light();
    const { error } = await exerciseService.reorderExercise(
      exercise.id,
      userId,
      selectedDay,
      direction,
    );
    setIsSubmitting(false);
    if (error) {
      Alert.alert('Errore', 'Impossibile riordinare');
    } else {
      hapticService.success();
      onSuccess();
    }
  };

  const handleDelete = () => {
    if (!exercise) return;

    Alert.alert(
      'Elimina esercizio',
      `Vuoi eliminare "${exercise.name}"? I log associati verranno rimossi.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            const { error } = await exerciseService.deleteExercise(exercise.id);
            setIsSubmitting(false);
            if (error) {
              Alert.alert('Errore', "Impossibile eliminare l'esercizio");
            } else {
              hapticService.success();
              onSuccess();
              onClose();
            }
          },
        },
      ],
    );
  };

  return (
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
            style={styles.content}
          >
            <View style={styles.header} testID="modal-add-exercise">
              <Text style={styles.title}>
                {isEditMode ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
              </Text>
              <TouchableOpacity
                testID="add-exercise-close-button"
                onPress={onClose}
                disabled={isSubmitting}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Chiudi"
                accessibilityState={{ disabled: isSubmitting }}
              >
                <Ionicons name="close" size={24} color={isSubmitting ? '#888' : '#fff'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome Esercizio</Text>
                  <TextInput
                    testID="add-exercise-name-input"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Es. Panca Piana"
                    placeholderTextColor="#666"
                    accessibilityLabel="Nome esercizio"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label} importantForAccessibility="no">
                    Gruppo Muscolare
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={group}
                    onChangeText={setGroup}
                    placeholder="Es. Petto"
                    placeholderTextColor="#666"
                    accessibilityLabel="Gruppo muscolare"
                  />
                </View>

                {isEditMode && (
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label} importantForAccessibility="no">
                        Serie
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={targetSets}
                        onChangeText={setTargetSets}
                        keyboardType="numeric"
                        placeholder="3"
                        placeholderTextColor="#666"
                        accessibilityLabel="Serie target"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label} importantForAccessibility="no">
                        Reps target
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={targetReps}
                        onChangeText={setTargetReps}
                        placeholder="10"
                        placeholderTextColor="#666"
                        accessibilityLabel="Ripetizioni target"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label} importantForAccessibility="no">
                    Giorno di Allenamento
                  </Text>
                  <View style={styles.daySelector} accessibilityRole="radiogroup">
                    {DAYS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
                        onPress={() => {
                          hapticService.light();
                          setSelectedDay(day);
                        }}
                        hitSlop={hitSlop}
                        accessibilityRole="radio"
                        accessibilityLabel={`Giorno ${day}`}
                        accessibilityHint="Assegna l’esercizio a questo giorno"
                        accessibilityState={{ selected: selectedDay === day }}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            selectedDay === day && styles.dayChipTextActive,
                          ]}
                          importantForAccessibility="no"
                        >
                          {day.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {isEditMode && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label} importantForAccessibility="no">
                      Posizione in scheda
                    </Text>
                    <View style={styles.reorderRow}>
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => handleReorder('up')}
                        disabled={isSubmitting}
                        hitSlop={hitSlop}
                        accessibilityRole="button"
                        accessibilityLabel="Sposta esercizio su"
                        accessibilityHint="Anticipa l’esercizio nella scheda del giorno"
                        accessibilityState={{ disabled: isSubmitting }}
                      >
                        <Ionicons name="arrow-up" size={20} color="#00ff88" />
                        <Text style={styles.reorderText} importantForAccessibility="no">
                          Su
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => handleReorder('down')}
                        disabled={isSubmitting}
                        hitSlop={hitSlop}
                        accessibilityRole="button"
                        accessibilityLabel="Sposta esercizio giù"
                        accessibilityHint="Posticipa l’esercizio nella scheda del giorno"
                        accessibilityState={{ disabled: isSubmitting }}
                      >
                        <Ionicons name="arrow-down" size={20} color="#00ff88" />
                        <Text style={styles.reorderText} importantForAccessibility="no">
                          Giù
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  testID="add-exercise-save-button"
                  style={[styles.saveBtn, isSubmitting && styles.disabled]}
                  onPress={handleSave}
                  disabled={isSubmitting}
                  hitSlop={hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={isEditMode ? 'Salva modifiche' : 'Aggiungi al catalogo'}
                  accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {isEditMode ? 'SALVA MODIFICHE' : 'AGGIUNGI AL CATALOGO'}
                    </Text>
                  )}
                </TouchableOpacity>

                {isEditMode && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ff4444" />
                    <Text style={styles.deleteBtnText}>Elimina esercizio</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  form: { gap: 20 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { gap: 10 },
  label: { fontSize: 12, color: '#00ff88', fontWeight: '800', textTransform: 'uppercase' },
  input: {
    backgroundColor: '#252525',
    color: '#fff',
    padding: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  daySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 55,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
  dayChipText: { color: '#888', fontSize: 12, fontWeight: '700' },
  dayChipTextActive: { color: '#000' },
  saveBtn: {
    backgroundColor: '#00ff88',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginBottom: 10,
  },
  deleteBtnText: { color: '#ff4444', fontWeight: '700', fontSize: 14 },
  reorderRow: { flexDirection: 'row', gap: 12 },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
  },
  reorderText: { color: '#00ff88', fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.5 },
});
