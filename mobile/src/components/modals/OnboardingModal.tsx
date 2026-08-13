import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '../../platform/icons';
import { profileService } from '../../services/profileService';
import { hapticService } from '../../services/soundService';

interface OnboardingModalProps {
  visible: boolean;
  userId: string;
  onComplete: () => void;
}

const EXPERIENCE_LEVELS = ['Principiante', 'Intermedio', 'Avanzato', 'Elite'];
const GOALS = ['Forza', 'Ipertrofia', 'Dimagrimento', 'Resistenza', 'Salute'];
const TRAINING_DAYS = [3, 4, 5, 6];
const SEX_OPTIONS = ['Maschio', 'Femmina', 'Altro'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  userId,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [height, setHeight] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [biologicalSex, setBiologicalSex] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [injuries, setInjuries] = useState('');
  const [equipment, setEquipment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    setIsSubmitting(true);
    hapticService.medium();

    const { error } = await profileService.saveSettings(userId, {
      height: height ? parseFloat(height) : null,
      birth_year: birthYear ? parseInt(birthYear, 10) : null,
      biological_sex: biologicalSex || null,
      experience_level: experienceLevel || null,
      primary_goal: primaryGoal || null,
      training_days_per_week: trainingDays,
      injuries_notes: injuries.trim() || null,
      gym_equipment: equipment.trim() || null,
      onboarding_completed: true,
    });

    setIsSubmitting(false);

    if (error) {
      hapticService.error();
      Alert.alert('Onboarding', 'Impossibile salvare il profilo. Riprova.');
      return;
    }

    hapticService.success();
    onComplete();
  };

  const renderChipRow = (options: string[], selected: string, onSelect: (val: string) => void) => (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, selected === opt && styles.chipActive]}
          onPress={() => {
            hapticService.light();
            onSelect(opt);
          }}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const steps = [
    <View key="welcome">
      <Text style={styles.stepTitle}>Benvenuto in KineFit</Text>
      <Text style={styles.stepDesc}>
        Configuriamo il tuo profilo per personalizzare allenamenti, recupero e analisi.
      </Text>
    </View>,
    <View key="bio">
      <Text style={styles.stepTitle}>Dati biometrici</Text>
      <Text style={styles.label}>Altezza (cm)</Text>
      <TextInput
        style={styles.input}
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
        placeholder="175"
        placeholderTextColor="#666"
      />
      <Text style={styles.label}>Anno di nascita</Text>
      <TextInput
        style={styles.input}
        value={birthYear}
        onChangeText={setBirthYear}
        keyboardType="numeric"
        placeholder="1990"
        placeholderTextColor="#666"
      />
      <Text style={styles.label}>Sesso biologico</Text>
      {renderChipRow(SEX_OPTIONS, biologicalSex, setBiologicalSex)}
    </View>,
    <View key="goals">
      <Text style={styles.stepTitle}>Obiettivi</Text>
      <Text style={styles.label}>Livello esperienza</Text>
      {renderChipRow(EXPERIENCE_LEVELS, experienceLevel, setExperienceLevel)}
      <Text style={styles.label}>Obiettivo principale</Text>
      {renderChipRow(GOALS, primaryGoal, setPrimaryGoal)}
      <Text style={styles.label}>Giorni di allenamento / settimana</Text>
      <View style={styles.chipRow}>
        {TRAINING_DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, trainingDays === d && styles.chipActive]}
            onPress={() => {
              hapticService.light();
              setTrainingDays(d);
            }}
          >
            <Text style={[styles.chipText, trainingDays === d && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>,
    <View key="injuries">
      <Text style={styles.stepTitle}>Note finali</Text>
      <Text style={styles.label}>Attrezzatura palestra (opzionale)</Text>
      <TextInput
        style={styles.input}
        value={equipment}
        onChangeText={setEquipment}
        placeholder="Es. rack, manubri, cavi..."
        placeholderTextColor="#666"
      />
      <Text style={styles.label}>Infortuni o limitazioni (opzionale)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={injuries}
        onChangeText={setInjuries}
        placeholder="Es. spalla destra, ginocchio..."
        placeholderTextColor="#666"
        multiline
        numberOfLines={4}
      />
    </View>,
  ];

  const isLastStep = step === steps.length - 1;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        testID="modal-onboarding"
      >
        <View style={styles.header}>
          <KineFitIcon />
          <Text style={styles.headerTitle}>Setup Profilo</Text>
          <Text style={styles.stepIndicator}>
            {step + 1} / {steps.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {steps[step]}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity
              testID="onboarding-back-button"
              style={styles.backBtn}
              onPress={() => {
                hapticService.light();
                setStep((s) => s - 1);
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.backBtnText}>Indietro</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="onboarding-next-button"
            style={[styles.nextBtn, isSubmitting && styles.disabled]}
            onPress={() => {
              if (isLastStep) {
                handleComplete();
              } else {
                hapticService.light();
                setStep((s) => s + 1);
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.nextBtnText}>{isLastStep ? 'INIZIA' : 'AVANTI'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const KineFitIcon = () => (
  <View style={styles.iconCircle}>
    <Ionicons name="barbell" size={28} color="#00ff88" />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20, gap: 8 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  stepIndicator: { color: '#666', fontSize: 12, fontWeight: '700' },
  scroll: { padding: 24, paddingBottom: 40 },
  stepTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  stepDesc: { color: '#888', fontSize: 15, lineHeight: 22 },
  label: {
    color: '#00ff88',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#252525',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: { backgroundColor: '#00ff88', borderColor: '#00ff88' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#000' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  backBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  backBtnText: { color: '#aaa', fontWeight: '700' },
  nextBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#00ff88',
  },
  nextBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
