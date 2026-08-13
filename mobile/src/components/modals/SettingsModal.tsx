import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { appConfig } from '../../platform/constants';
import { Ionicons } from '../../platform/icons';
import { useStore } from '../../store/useStore';
import { colors, hitSlop, radius, space, typography } from '../../theme';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
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

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay} testID="modal-settings">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Chiudi impostazioni"
        />
        <View style={styles.content}>
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
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Allenamento
            </Text>

            <Pressable
              style={styles.settingItem}
              onPress={() => setHapticsEnabled(!hapticsEnabled)}
              accessibilityRole="switch"
              accessibilityLabel="Vibrazione"
              accessibilityHint="Feedback aptico al salvataggio set"
              accessibilityState={{ checked: hapticsEnabled }}
            >
              <View style={styles.settingInfo} importantForAccessibility="no-hide-descendants">
                <Text style={styles.settingLabel}>Vibrazione</Text>
                <Text style={styles.settingDesc}>Feedback aptico al salvataggio set</Text>
              </View>
              <Switch
                testID="settings-haptics-switch"
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={hapticsEnabled ? colors.text : colors.textMuted}
                accessibilityLabel="Vibrazione"
                accessibilityRole="switch"
                accessibilityState={{ checked: hapticsEnabled }}
              />
            </Pressable>

            <Pressable
              style={styles.settingItem}
              onPress={() => setTimerAutoStart(!timerAutoStart)}
              accessibilityRole="switch"
              accessibilityLabel="Timer automatico"
              accessibilityHint="Avvia il recupero dopo ogni set"
              accessibilityState={{ checked: timerAutoStart }}
            >
              <View style={styles.settingInfo} importantForAccessibility="no-hide-descendants">
                <Text style={styles.settingLabel}>Timer automatico</Text>
                <Text style={styles.settingDesc}>Avvia il recupero dopo ogni set</Text>
              </View>
              <Switch
                testID="settings-timer-auto-switch"
                value={timerAutoStart}
                onValueChange={setTimerAutoStart}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={timerAutoStart ? colors.text : colors.textMuted}
                accessibilityLabel="Timer automatico"
                accessibilityRole="switch"
                accessibilityState={{ checked: timerAutoStart }}
              />
            </Pressable>

            <Pressable
              style={styles.settingItem}
              onPress={() => setTimerSoundEnabled(!timerSoundEnabled)}
              accessibilityRole="switch"
              accessibilityLabel="Suono timer"
              accessibilityHint="Beep a fine recupero"
              accessibilityState={{ checked: timerSoundEnabled }}
            >
              <View style={styles.settingInfo} importantForAccessibility="no-hide-descendants">
                <Text style={styles.settingLabel}>Suono timer</Text>
                <Text style={styles.settingDesc}>Beep a fine recupero</Text>
              </View>
              <Switch
                testID="settings-timer-sound-switch"
                value={timerSoundEnabled}
                onValueChange={setTimerSoundEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={timerSoundEnabled ? colors.text : colors.textMuted}
                accessibilityLabel="Suono timer"
                accessibilityRole="switch"
                accessibilityState={{ checked: timerSoundEnabled }}
              />
            </Pressable>

            <Text style={styles.sectionTitle} accessibilityRole="header">
              Sistema
            </Text>

            <Pressable
              style={styles.settingItem}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              accessibilityRole="switch"
              accessibilityLabel="Notifiche"
              accessibilityHint="Avvisi a fine recupero"
              accessibilityState={{ checked: notificationsEnabled }}
            >
              <View style={styles.settingInfo} importantForAccessibility="no-hide-descendants">
                <Text style={styles.settingLabel}>Notifiche</Text>
                <Text style={styles.settingDesc}>Avvisi a fine recupero</Text>
              </View>
              <Switch
                testID="settings-notifications-switch"
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={notificationsEnabled ? colors.text : colors.textMuted}
                accessibilityLabel="Notifiche"
                accessibilityRole="switch"
                accessibilityState={{ checked: notificationsEnabled }}
              />
            </Pressable>

            <View
              style={styles.settingItem}
              accessibilityRole="text"
              accessibilityLabel="Unità di misura: chilogrammi"
            >
              <View style={styles.settingInfo} importantForAccessibility="no-hide-descendants">
                <Text style={styles.settingLabel}>Unità di misura</Text>
              </View>
              <Text style={styles.valueText} importantForAccessibility="no">
                kg
              </Text>
            </View>

            <View
              style={styles.footer}
              accessibilityRole="text"
              accessibilityLabel={`KineFit versione ${version}`}
            >
              <Text style={styles.version}>KineFit v{version}</Text>
              <Text style={styles.copyright}>© 2026 Coemi Elite Apps</Text>
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
  settingInfo: { flex: 1, marginRight: space.md },
  settingLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  settingDesc: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  valueText: { color: colors.accent, fontWeight: '700' },
  footer: { marginTop: space.xxxl, alignItems: 'center', paddingBottom: space.lg },
  version: { color: colors.textFaint, fontSize: 12, fontWeight: '700' },
  copyright: { color: colors.textFaint, fontSize: 10, marginTop: 5, opacity: 0.7 },
});
