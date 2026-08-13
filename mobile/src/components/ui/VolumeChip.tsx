import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatVolumeA11yLabel, formatVolumeKg } from '../../lib/volumeFormat';
import { Ionicons } from '../../platform/icons';
import { colors, radius, space } from '../../theme';

type Props = {
  kg: number;
  testID: string;
};

/** Chip volume giornata (kg) — header Oggi, accanto allo streak. */
export function VolumeChip({ kg, testID }: Props) {
  return (
    <View
      style={styles.chip}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={formatVolumeA11yLabel(kg)}
    >
      <Ionicons name="barbell-outline" size={14} color={colors.accent} />
      <Text style={styles.text}>{formatVolumeKg(kg)}</Text>
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
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  text: { color: colors.accent, fontSize: 12, fontWeight: '800' },
});
