import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { hapticService } from '../../services/soundService';
import { useTimerStore } from '../../store/useTimerStore';

export const FloatingTimer = () => {
  const { isActive, timeLeft, tick, stopTimer, adjustTime } = useTimerStore();
  const prevActiveRef = useRef(false);

  // Interval loop: slegato dal valore del timeLeft per non ricrearsi continuamente
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        tick();
      }, 250); // Refresh UI rapido (ogni quarto di secondo controlliamo Date.now)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, tick]);

  // Haptic feedback logic e reset
  useEffect(() => {
    if (prevActiveRef.current && !isActive && timeLeft === 0) {
      hapticService.success();
    }
    prevActiveRef.current = isActive;
  }, [isActive, timeLeft]);

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => {
            hapticService.light();
            adjustTime(-15);
          }}
          style={styles.adjustBtn}
        >
          <Ionicons name="remove" size={18} color="#aaa" />
        </TouchableOpacity>

        <View style={styles.timerDisplay}>
          <Ionicons name="timer-outline" size={18} color="#00ff88" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            hapticService.light();
            adjustTime(15);
          }}
          style={styles.adjustBtn}
        >
          <Ionicons name="add" size={18} color="#00ff88" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity onPress={stopTimer} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 85, alignSelf: 'center', zIndex: 9999 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 60,
    justifyContent: 'center',
  },
  timerText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { width: 1, height: 20, backgroundColor: '#333', marginHorizontal: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
