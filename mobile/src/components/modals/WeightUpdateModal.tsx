import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';

interface WeightUpdateModalProps {
  visible: boolean;
  userId: string;
  initialWeight: number | null | undefined;
  onClose: () => void;
  onSaved: () => void;
}

const WeightUpdateForm: React.FC<Omit<WeightUpdateModalProps, 'visible'>> = ({
  userId,
  initialWeight,
  onClose,
  onSaved,
}) => {
  const [weightInput, setWeightInput] = useState(
    initialWeight != null ? String(initialWeight) : '',
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
      Alert.alert('Errore', 'Inserisci un peso valido (1–500 kg)');
      return;
    }

    setSaving(true);
    const { error } = await profileService.saveWeight(userId, parsed);
    setSaving(false);

    if (error) {
      Alert.alert('Errore', 'Impossibile salvare il peso');
      return;
    }

    hapticService.success();
    onSaved();
    onClose();
  };

  return (
    <View style={styles.overlay} testID="modal-weight-update">
      <View style={styles.content}>
        <Text style={styles.title}>Aggiorna Peso</Text>
        <Text style={styles.desc}>Inserisci il tuo peso corporeo attuale (kg)</Text>
        <TextInput
          style={styles.input}
          value={weightInput}
          onChangeText={setWeightInput}
          keyboardType="decimal-pad"
          placeholder="75"
          placeholderTextColor="#666"
          autoFocus
        />
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancel} onPress={onClose} disabled={saving}>
            <Text style={styles.cancelText}>Annulla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.save, saving && styles.disabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>Salva</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const WeightUpdateModal: React.FC<WeightUpdateModalProps> = ({
  visible,
  onClose,
  ...formProps
}) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    {visible ? <WeightUpdateForm {...formProps} onClose={onClose} /> : null}
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#252525',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  desc: { color: '#888', fontSize: 14, marginBottom: 20 },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    padding: 16,
    borderRadius: 12,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  actions: { flexDirection: 'row', gap: 12 },
  cancel: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelText: { color: '#aaa', fontWeight: '700' },
  save: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#00ff88',
  },
  saveText: { color: '#000', fontWeight: '900' },
  disabled: { opacity: 0.5 },
});
