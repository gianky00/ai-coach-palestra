import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { appConfig } from '../../platform/constants';
import { Ionicons } from '../../platform/icons';
import { useStore } from '../../store/useStore';
import { colors, hitSlop, radius, space, typography } from '../../theme';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

type SettingToggleProps = {
  testID: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

/** Row owns a11y; Switch is visual-only to avoid double announcement. */
function SettingToggleRow({
  testID,
  label,
  description,
  value,
  onValueChange,
}: SettingToggleProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingItem, pressed && styles.settingPressed]}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
    >
      <View style={styles.settingInfo} importantForAccessibility="no-hide-descendants">
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={value ? colors.text : colors.textMuted}
        pointerEvents="none"
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const hapticsEnabled = useStore((s) => s.hapticsEnabled);
  const timerAutoStart = useStore((s) => s.timerAutoStart);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const timerSoundEnabled = useStore((s) => s.timerSoundEnabled);
  const setHapticsEnabled = useStore((s) => s.setHapticsEnabled);
  const setTimerAutoStart = useStore((s) => s.setTimerAutoStart);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const setTimerSoundEnabled = useStore((s) => s.setTimerSoundEnabled);

  const version = appConfig.version;
  const privacyPolicyUrl = appConfig.privacyPolicyUrl;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay} testID="modal-settings">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Chiudi impostazioni"
          accessibilityHint="Chiude la finestra senza salvare altro — le preferenze restano aggiornate"
        />
        <View style={styles.content} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Impostazioni
            </Text>
            <Pressable
              testID="settings-close-button"
              onPress={onClose}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Chiudi"
              accessibilityHint="Chiude la finestra impostazioni"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text
              testID="settings-section-allenamento"
              style={styles.sectionTitle}
              accessibilityRole="header"
            >
              Allenamento
            </Text>

            <SettingToggleRow
              testID="settings-haptics-switch"
              label="Vibrazione"
              description="Feedback aptico al salvataggio set"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
            />

            <SettingToggleRow
              testID="settings-timer-auto-switch"
              label="Timer automatico"
              description="Avvia il recupero dopo ogni set"
              value={timerAutoStart}
              onValueChange={setTimerAutoStart}
            />

            <SettingToggleRow
              testID="settings-timer-sound-switch"
              label="Suono timer"
              description="Beep a fine recupero"
              value={timerSoundEnabled}
              onValueChange={setTimerSoundEnabled}
            />

            <Text
              testID="settings-section-sistema"
              style={styles.sectionTitle}
              accessibilityRole="header"
            >
              Sistema
            </Text>

            <SettingToggleRow
              testID="settings-notifications-switch"
              label="Notifiche"
              description="Avvisi a fine recupero"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />

            <View
              testID="settings-units-row"
              style={styles.settingItem}
              accessibilityRole="text"
              accessibilityLabel="Unità di misura: chilogrammi"
              accessibilityHint="Unità fissa per pesi e volume — non modificabile"
            >
              <View style={styles.settingInfo} importantForAccessibility="no-hide-descendants">
                <Text style={styles.settingLabel}>Unità di misura</Text>
                <Text style={styles.settingDesc}>Pesi e volume in chilogrammi</Text>
              </View>
              <Text style={styles.valueText} importantForAccessibility="no">
                kg
              </Text>
            </View>

            {privacyPolicyUrl ? (
              <Pressable
                testID="settings-privacy-row"
                style={({ pressed }) => [styles.settingItem, pressed && styles.settingPressed]}
                onPress={() => {
                  void Linking.openURL(privacyPolicyUrl);
                }}
                accessibilityRole="link"
                accessibilityLabel="Informativa privacy"
                accessibilityHint="Apre l'informativa privacy nel browser"
              >
                <View style={styles.settingInfo} importantForAccessibility="no-hide-descendants">
                  <Text style={styles.settingLabel}>Informativa privacy</Text>
                  <Text style={styles.settingDesc}>Apri la privacy policy nel browser</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={colors.accent} />
              </Pressable>
            ) : null}

            <View
              testID="settings-version"
              style={styles.footer}
              accessibilityRole="text"
              accessibilityLabel={`KineFit versione ${version}`}
            >
              <Text style={styles.version} importantForAccessibility="no">
                KineFit v{version}
              </Text>
              <Text style={styles.copyright} importantForAccessibility="no">
                © 2026 Coemi Elite Apps
              </Text>
            </View>
          </ScrollView>
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
    padding: space.xl,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.xxl,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xxl,
  },
  title: { ...typography.title, fontSize: 24, color: colors.text },
  sectionTitle: {
    ...typography.overline,
    color: colors.accent,
    marginBottom: space.md,
    marginTop: space.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  settingPressed: { opacity: 0.85 },
  settingInfo: { flex: 1, marginRight: space.md },
  settingLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  settingDesc: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  valueText: { color: colors.accent, fontWeight: '700' },
  footer: { marginTop: space.xxxl, alignItems: 'center', paddingBottom: space.lg },
  version: { color: colors.textFaint, fontSize: 12, fontWeight: '700' },
  copyright: { color: colors.textFaint, fontSize: 10, marginTop: 5, opacity: 0.7 },
});
