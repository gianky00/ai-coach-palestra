import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  formatStreakA11yLabel,
  formatStreakLabel,
  type HabitStreak,
  normalizeHabitStreak,
} from '../../lib/streak';
import { Ionicons } from '../../platform/icons';
import { colors, radius, space } from '../../theme';

type Props = {
  streak: HabitStreak;
  testID: string;
};

/** Chip streak condiviso tra Oggi e Profilo (stesso copy, token e a11y). */
export function StreakChip({ streak, testID }: Props) {
  const safe = normalizeHabitStreak(streak);
  return (
    <View
      style={styles.chip}
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={formatStreakA11yLabel(safe)}
    >
      <Ionicons
        name="flame-outline"
        size={14}
        color={colors.warning}
        importantForAccessibility="no"
      />
      <Text style={styles.text} importantForAccessibility="no">
        {formatStreakLabel(safe)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginTop: space.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  text: { color: colors.warning, fontSize: 12, fontWeight: '800' },
});
