import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';
import { colors, hitSlop, radius, space, typography } from '../../theme';

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
    if (saving) return;
    const parsed = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
      Alert.alert('Peso non valido', 'Inserisci un valore tra 1 e 500 kg.');
      return;
    }

    setSaving(true);
    const { error } = await profileService.saveWeight(userId, parsed);
    setSaving(false);

    if (error) {
      Alert.alert('Salvataggio non riuscito', 'Impossibile salvare il peso. Riprova tra poco.');
      return;
    }

    hapticService.success();
    onSaved();
    onClose();
  };

  return (
    <View style={styles.overlay} testID="modal-weight-update">
      <View style={styles.content}>
        <Text style={styles.title}>Aggiorna peso</Text>
        <Text style={styles.desc}>Inserisci il tuo peso corporeo attuale (kg)</Text>
        <TextInput
          testID="weight-update-input"
          style={styles.input}
          value={weightInput}
          onChangeText={setWeightInput}
          keyboardType="decimal-pad"
          placeholder="75"
          placeholderTextColor={colors.textDim}
          autoFocus
          accessibilityLabel="Peso corporeo in chilogrammi"
        />
        <View style={styles.actions}>
          <Pressable
            testID="weight-update-cancel-button"
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            onPress={onClose}
            disabled={saving}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Annulla"
            accessibilityState={{ disabled: saving }}
          >
            <Text style={styles.cancelText}>Annulla</Text>
          </Pressable>
          <Pressable
            testID="weight-update-save-button"
            style={({ pressed }) => [
              styles.save,
              saving && styles.disabled,
              pressed && !saving && styles.pressed,
            ]}
            onPress={() => {
              void handleSave();
            }}
            disabled={saving}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Salva peso"
            accessibilityState={{ disabled: saving, busy: saving }}
          >
            <Text style={styles.saveText}>{saving ? 'Salvataggio…' : 'Salva'}</Text>
          </Pressable>
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
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.xl,
  },
  content: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    padding: space.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.section, color: colors.text, fontSize: 20, marginBottom: space.sm },
  desc: { color: colors.textMuted, fontSize: 14, marginBottom: space.xl },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    padding: space.lg,
    borderRadius: radius.md,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.xl,
  },
  actions: { flexDirection: 'row', gap: space.md },
  cancel: {
    flex: 1,
    padding: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
  save: {
    flex: 1,
    padding: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  saveText: { color: colors.accentOn, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.88 },
});
