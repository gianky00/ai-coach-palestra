import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { UserSettings } from '../../lib/profileMappers';
import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';

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
    const heightVal = height.trim() ? parseFloat(height.replace(',', '.')) : null;
    const daysVal = days.trim() ? parseInt(days, 10) : null;
    if (heightVal != null && (isNaN(heightVal) || heightVal < 100 || heightVal > 250)) {
      Alert.alert('Errore', 'Altezza non valida (100–250 cm)');
      return;
    }
    if (daysVal != null && (isNaN(daysVal) || daysVal < 1 || daysVal > 7)) {
      Alert.alert('Errore', 'Giorni/settimana non validi (1–7)');
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
      Alert.alert('Errore', 'Impossibile salvare il profilo');
      return;
    }
    hapticService.success();
    onSaved();
    onClose();
  };

  return (
    <View style={styles.overlay} testID="modal-profile-edit">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <Text style={styles.title}>Modifica profilo</Text>
          <Text style={styles.label}>Altezza (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
          <Text style={styles.label}>Esperienza</Text>
          <TextInput
            style={styles.input}
            value={experience}
            onChangeText={setExperience}
            placeholder="Intermedio"
            placeholderTextColor="#666"
          />
          <Text style={styles.label}>Obiettivo</Text>
          <TextInput
            style={styles.input}
            value={goal}
            onChangeText={setGoal}
            placeholder="Ipertrofia"
            placeholderTextColor="#666"
          />
          <Text style={styles.label}>Giorni / settimana</Text>
          <TextInput
            style={styles.input}
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            placeholder="4"
            placeholderTextColor="#666"
          />
          <Text style={styles.label}>Attrezzatura palestra</Text>
          <TextInput
            style={styles.input}
            value={equipment}
            onChangeText={setEquipment}
            placeholder="Rack, manubri, cavi..."
            placeholderTextColor="#666"
          />
          <Text style={styles.label}>Infortuni / note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={injuries}
            onChangeText={setInjuries}
            multiline
            placeholderTextColor="#666"
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  content: {
    backgroundColor: '#252525',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  label: {
    color: '#00ff88',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
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
