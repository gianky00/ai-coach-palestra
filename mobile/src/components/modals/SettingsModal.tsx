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
  const {
    hapticsEnabled,
    timerAutoStart,
    notificationsEnabled,
    timerSoundEnabled,
    setHapticsEnabled,
    setTimerAutoStart,
    setNotificationsEnabled,
    setTimerSoundEnabled,
  } = useStore();

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
            <Text style={styles.title}>Impostazioni</Text>
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
            <Text style={styles.sectionTitle}>Allenamento</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Vibrazione</Text>
                <Text style={styles.settingDesc}>Feedback aptico al salvataggio set</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={hapticsEnabled ? colors.text : colors.textMuted}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Timer automatico</Text>
                <Text style={styles.settingDesc}>Avvia il recupero dopo ogni set</Text>
              </View>
              <Switch
                value={timerAutoStart}
                onValueChange={setTimerAutoStart}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={timerAutoStart ? colors.text : colors.textMuted}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Suono timer</Text>
                <Text style={styles.settingDesc}>Beep a fine recupero</Text>
              </View>
              <Switch
                value={timerSoundEnabled}
                onValueChange={setTimerSoundEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={timerSoundEnabled ? colors.text : colors.textMuted}
              />
            </View>

            <Text style={styles.sectionTitle}>Sistema</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notifiche</Text>
                <Text style={styles.settingDesc}>Avvisi a fine recupero</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={notificationsEnabled ? colors.text : colors.textMuted}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Unità di misura</Text>
              </View>
              <Text style={styles.valueText}>kg</Text>
            </View>

            <View style={styles.footer}>
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
