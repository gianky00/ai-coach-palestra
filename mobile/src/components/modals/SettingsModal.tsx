import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useStore } from '../../store/useStore';

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

  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Impostazioni</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Allenamento</Text>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Vibrazione (Aptico)</Text>
                    <Text style={styles.settingDesc}>Feedback fisico al salvataggio set</Text>
                  </View>
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={setHapticsEnabled}
                    trackColor={{ false: '#333', true: '#00ff88' }}
                    thumbColor={hapticsEnabled ? '#fff' : '#888'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Timer Automatico</Text>
                    <Text style={styles.settingDesc}>Avvia il recupero dopo ogni set</Text>
                  </View>
                  <Switch
                    value={timerAutoStart}
                    onValueChange={setTimerAutoStart}
                    trackColor={{ false: '#333', true: '#00ff88' }}
                    thumbColor={timerAutoStart ? '#fff' : '#888'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Suono Timer</Text>
                    <Text style={styles.settingDesc}>Beep a fine recupero</Text>
                  </View>
                  <Switch
                    value={timerSoundEnabled}
                    onValueChange={setTimerSoundEnabled}
                    trackColor={{ false: '#333', true: '#00ff88' }}
                    thumbColor={timerSoundEnabled ? '#fff' : '#888'}
                  />
                </View>

                <Text style={styles.sectionTitle}>Sistema</Text>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Notifiche Push</Text>
                    <Text style={styles.settingDesc}>Avvisi a fine recupero</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#333', true: '#00ff88' }}
                    thumbColor={notificationsEnabled ? '#fff' : '#888'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Unità di Misura</Text>
                  </View>
                  <Text style={styles.valueText}>Chilogrammi (kg)</Text>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.version}>KineFit Mobile v{version} (Elite)</Text>
                  <Text style={styles.copyright}>© 2026 Coemi Elite Apps</Text>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 30,
    padding: 25,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  sectionTitle: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 15,
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  settingInfo: { flex: 1, marginRight: 15 },
  settingLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  settingDesc: { color: '#666', fontSize: 12, marginTop: 4 },
  valueText: { color: '#00ff88', fontWeight: '700' },
  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 20 },
  version: { color: '#444', fontSize: 12, fontWeight: '700' },
  copyright: { color: '#333', fontSize: 10, marginTop: 5 },
});
