import { Ionicons } from '@expo/vector-icons';
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
import { exerciseService } from '../../services/exerciseService';
import { hapticService } from '../../services/soundService';

interface AddExerciseModalProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDay?: string;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  userId,
  visible,
  onClose,
  onSuccess,
  defaultDay,
}) => {
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [selectedDay, setSelectedDay] = useState(defaultDay || DAYS[new Date().getDay()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddExercise = async () => {
    if (!newName.trim()) {
      Alert.alert('Attenzione', "Il nome dell'esercizio è obbligatorio");
      return;
    }

    setIsSubmitting(true);
    hapticService.medium();

    try {
      const { error } = await exerciseService.addExercise(
        userId,
        newName.trim(),
        newGroup.trim(),
        selectedDay,
      );

      if (error) {
        Alert.alert('Errore', "Impossibile aggiungere l'esercizio");
      } else {
        hapticService.success();
        onSuccess();
        onClose();
        setNewName('');
        setNewGroup('');
      }
    } catch (err) {
      console.error('Error adding exercise:', err);
      Alert.alert('Errore', 'Si è verificato un problema imprevisto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
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
              style={styles.content}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Nuovo Esercizio</Text>
                <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                  <Ionicons name="close" size={24} color={isSubmitting ? '#888' : '#fff'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome Esercizio</Text>
                    <TextInput
                      style={styles.input}
                      value={newName}
                      onChangeText={(newName) => setNewName(newName)}
                      placeholder="Es. Panca Piana"
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Gruppo Muscolare</Text>
                    <TextInput
                      style={styles.input}
                      value={newGroup}
                      onChangeText={(newGroup) => setNewGroup(newGroup)}
                      placeholder="Es. Petto"
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Giorno di Allenamento</Text>
                    <View style={styles.daySelector}>
                      {DAYS.map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
                          onPress={() => {
                            hapticService.light();
                            setSelectedDay(day);
                          }}
                        >
                          <Text
                            style={[
                              styles.dayChipText,
                              selectedDay === day && styles.dayChipTextActive,
                            ]}
                          >
                            {day.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.saveBtn, isSubmitting && styles.disabled]}
                    onPress={handleAddExercise}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.saveBtnText}>AGGIUNGI AL CATALOGO</Text>
                    )}
                  </TouchableOpacity>
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
    marginBottom: 10,
  },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
