import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  formatRestDurationA11y,
  formatRestPresetA11yLabel,
  formatRestPresetLabel,
  matchRestPreset,
  REST_PRESETS_SECONDS,
} from '../../lib/restPresets';
import { useSmokeMode } from '../../lib/SmokeContext';
import { isSmokeActive } from '../../lib/smokeMode';
import { Ionicons } from '../../platform/icons';
import { hapticService, soundService } from '../../services/soundService';
import { useTimerStore } from '../../store/useTimerStore';
import { colors, hitSlop, radius, space } from '../../theme';
import { Button } from './Button';

export const FloatingTimer = () => {
  const isActive = useTimerStore((s) => s.isActive);
  const timeLeft = useTimerStore((s) => s.timeLeft);
  const initialTime = useTimerStore((s) => s.initialTime);
  const tick = useTimerStore((s) => s.tick);
  const stopTimer = useTimerStore((s) => s.stopTimer);
  const adjustTime = useTimerStore((s) => s.adjustTime);
  const startTimer = useTimerStore((s) => s.startTimer);
  const smokeMode = useSmokeMode();
  // Smoke UI verify: freeze countdown so uiautomator can reach idle and dump
  // timer-rest-presets (1Hz ticks otherwise flake Wait-UiPattern).
  const freezeTicks = isSmokeActive(smokeMode);
  const prevActiveRef = useRef(false);
  const selectedPreset = matchRestPreset(initialTime);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isActive && !freezeTicks) {
      // Poll ~4Hz; useTimerStore.tick coalesces set() to 1Hz (second boundary).
      interval = setInterval(() => {
        tick();
      }, 250);
    }
    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [isActive, tick, freezeTicks]);

  useEffect(() => {
    if (prevActiveRef.current && !isActive && timeLeft === 0) {
      void soundService.playBeep();
    }
    prevActiveRef.current = isActive;
  }, [isActive, timeLeft]);

  if (!isActive) return null;

  return (
    <View style={styles.container} testID="floating-timer">
      <View style={styles.content}>
        <TouchableOpacity
          testID="timer-minus-15"
          onPress={() => {
            hapticService.light();
            adjustTime(-15);
          }}
          style={styles.adjustBtn}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Riduci timer di 15 secondi"
          accessibilityHint="Accorcia il recupero rimanente"
        >
          <Ionicons name="remove" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View
          style={styles.timerDisplay}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Timer recupero ${formatRestDurationA11y(timeLeft)}`}
        >
          <Ionicons name="timer-outline" size={18} color={colors.accent} />
          <Text style={styles.timerText} testID="timer-display" importantForAccessibility="no">
            {formatRestPresetLabel(timeLeft)}
          </Text>
        </View>

        <TouchableOpacity
          testID="timer-plus-15"
          onPress={() => {
            hapticService.light();
            adjustTime(15);
          }}
          style={styles.adjustBtn}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Aumenta timer di 15 secondi"
          accessibilityHint="Allunga il recupero rimanente"
        >
          <Ionicons name="add" size={18} color={colors.accent} />
        </TouchableOpacity>

        <View style={styles.divider} importantForAccessibility="no" />

        <TouchableOpacity
          testID="timer-close"
          onPress={stopTimer}
          style={styles.closeBtn}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Chiudi timer"
          accessibilityHint="Ferma e nasconde il timer di recupero"
        >
          <Ionicons name="close" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsRow}
        testID="timer-rest-presets"
      >
        {REST_PRESETS_SECONDS.map((secs) => {
          const selected = selectedPreset === secs;
          return (
            <Button
              key={secs}
              testID={`timer-rest-preset-${secs}`}
              variant="outline"
              style={[styles.presetChip, selected && styles.presetChipSelected]}
              textStyle={[styles.presetText, selected && styles.presetTextSelected]}
              title={formatRestPresetLabel(secs)}
              onPress={() => {
                hapticService.medium();
                startTimer(secs);
              }}
              accessibilityLabel={formatRestPresetA11yLabel(secs)}
              accessibilityState={{ selected }}
              accessibilityHint="Imposta il timer di recupero su questo preset"
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85,
    alignSelf: 'center',
    zIndex: 9999,
    alignItems: 'center',
    gap: space.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
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
  timerText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.sm,
  },
  presetChip: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    minWidth: 52,
  },
  presetChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  presetText: { fontSize: 12, fontWeight: '800', color: colors.accent },
  presetTextSelected: { color: colors.accent },
});
