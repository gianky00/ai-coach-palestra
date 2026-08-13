import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { UserSettings } from '../../lib/profileMappers';
import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';
import { colors, hitSlop, radius, space, typography } from '../../theme';

interface ProfileEditModalProps {
  visible: boolean;
  userId: string;
  settings: UserSettings | null | undefined;
  onClose: () => void;
  onSaved: () => void;
}

/** Form montata solo a modal aperta → stato iniziale da props senza effect. */
const ProfileEditForm: React.FC<Omit<ProfileEditModalProps, 'visible'>> = ({
  userId,
  settings,
  onClose,
  onSaved,
}) => {
  const [height, setHeight] = useState(settings?.height != null ? String(settings.height) : '');
  const [experience, setExperience] = useState(settings?.experience_level ?? '');
  const [goal, setGoal] = useState(settings?.primary_goal ?? '');
  const [days, setDays] = useState(
    settings?.training_days_per_week != null ? String(settings.training_days_per_week) : '',
  );
  const [equipment, setEquipment] = useState(settings?.gym_equipment ?? '');
  const [injuries, setInjuries] = useState(settings?.injuries_notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    const heightVal = height.trim() ? parseFloat(height.replace(',', '.')) : null;
    const daysVal = days.trim() ? parseInt(days, 10) : null;
    if (heightVal != null && (isNaN(heightVal) || heightVal < 100 || heightVal > 250)) {
      Alert.alert('Altezza non valida', 'Inserisci un valore tra 100 e 250 cm.');
      return;
    }
    if (daysVal != null && (isNaN(daysVal) || daysVal < 1 || daysVal > 7)) {
      Alert.alert('Giorni non validi', 'Inserisci un numero tra 1 e 7.');
      return;
    }

    setSaving(true);
    const { error } = await profileService.saveSettings(userId, {
      height: heightVal,
      experience_level: experience.trim() || null,
      primary_goal: goal.trim() || null,
      training_days_per_week: daysVal,
      gym_equipment: equipment.trim() || null,
      injuries_notes: injuries.trim() || null,
    });
    setSaving(false);

    if (error) {
      Alert.alert('Salvataggio non riuscito', 'Impossibile salvare il profilo. Riprova tra poco.');
      return;
    }
    hapticService.success();
    onSaved();
    onClose();
  };

  return (
    <View style={styles.overlay} testID="modal-profile-edit">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Modifica profilo</Text>
          <Text style={styles.label}>Altezza (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholderTextColor={colors.textDim}
            accessibilityLabel="Altezza in centimetri"
          />
          <Text style={styles.label}>Esperienza</Text>
          <TextInput
            style={styles.input}
            value={experience}
            onChangeText={setExperience}
            placeholder="Intermedio"
            placeholderTextColor={colors.textDim}
            accessibilityLabel="Livello di esperienza"
          />
          <Text style={styles.label}>Obiettivo</Text>
          <TextInput
            style={styles.input}
            value={goal}
            onChangeText={setGoal}
            placeholder="Ipertrofia"
            placeholderTextColor={colors.textDim}
            accessibilityLabel="Obiettivo principale"
          />
          <Text style={styles.label}>Giorni / settimana</Text>
          <TextInput
            style={styles.input}
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            placeholder="4"
            placeholderTextColor={colors.textDim}
            accessibilityLabel="Giorni di allenamento a settimana"
          />
          <Text style={styles.label}>Attrezzatura palestra</Text>
          <TextInput
            style={styles.input}
            value={equipment}
            onChangeText={setEquipment}
            placeholder="Rack, manubri, cavi..."
            placeholderTextColor={colors.textDim}
            accessibilityLabel="Attrezzatura palestra"
          />
          <Text style={styles.label}>Infortuni / note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={injuries}
            onChangeText={setInjuries}
            multiline
            placeholderTextColor={colors.textDim}
            accessibilityLabel="Note infortuni"
          />
          <View style={styles.actions}>
            <Pressable
              testID="profile-edit-cancel-button"
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
              testID="profile-edit-save-button"
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
              accessibilityLabel="Salva profilo"
              accessibilityState={{ disabled: saving, busy: saving }}
            >
              <Text style={styles.saveText}>{saving ? 'Salvataggio…' : 'Salva'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  ...formProps
}) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    {visible ? <ProfileEditForm {...formProps} onClose={onClose} /> : null}
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
  content: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    padding: space.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.section, color: colors.text, fontSize: 20, marginBottom: space.sm },
  label: {
    ...typography.overline,
    color: colors.accent,
    marginBottom: 6,
    marginTop: space.sm,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
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
